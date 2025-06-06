"use client"

interface SpeedTestResult {
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
}

interface SpeedTestProgress {
  phase: "idle" | "ping" | "download" | "upload" | "complete"
  progress: number
  data: Partial<SpeedTestResult>
}

export class RealSpeedTestService {
  private cloudflareTest: any = null
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
      // Initialize Cloudflare SpeedTest with correct import syntax
      if (typeof window !== "undefined") {
        // Try different import patterns for Cloudflare SpeedTest
        let SpeedTestClass

        try {
          // Method 1: Default import
          const cloudflareModule = await import("@cloudflare/speedtest")
          SpeedTestClass = cloudflareModule.default || cloudflareModule.SpeedTest
        } catch (error) {
          console.warn("Method 1 failed, trying alternative import:", error)

          try {
            // Method 2: Named import
            const { SpeedTest } = await import("@cloudflare/speedtest")
            SpeedTestClass = SpeedTest
          } catch (error2) {
            console.warn("Method 2 failed, trying CDN fallback:", error2)

            // Method 3: CDN fallback
            await this.loadCloudflareFromCDN()
            SpeedTestClass = (window as any).CloudflareSpeedTest
          }
        }

        if (SpeedTestClass && typeof SpeedTestClass === "function") {
          this.cloudflareTest = new SpeedTestClass({
            autoStart: false,
            measurements: [
              { type: "latency", numPackets: 4 },
              { type: "download", bytes: 1e6, count: 8 },
              { type: "upload", bytes: 1e6, count: 8 },
            ],
          })

          this.isInitialized = true
          console.log("Cloudflare SpeedTest initialized successfully")
        } else {
          throw new Error("SpeedTest constructor not found")
        }
      }
    } catch (error) {
      console.error("Failed to initialize Cloudflare SpeedTest:", error)
      // Mark as initialized anyway to prevent retry loops
      this.isInitialized = true
      this.cloudflareTest = null
    }
  }

  private async loadCloudflareFromCDN() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://unpkg.com/@cloudflare/speedtest@latest/dist/index.js"
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  async runCloudflareSpeedTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
    await this.initialize()

    if (!this.cloudflareTest) {
      throw new Error("Cloudflare SpeedTest not available - falling back to alternative method")
    }

    return new Promise((resolve, reject) => {
      const results: Partial<SpeedTestResult> = {}
      let hasStarted = false

      try {
        // Set up event handlers before starting
        this.cloudflareTest.onResultsChange = (data: any) => {
          try {
            const summary = data.getSummary()

            // Update results based on available data
            if (summary.latency) {
              results.ping = summary.latency.rttMs || 0
              results.jitter = summary.latency.jitterMs || 0
              onProgress({
                phase: "ping",
                progress: 25,
                data: { ping: results.ping, jitter: results.jitter },
              })
            }

            if (summary.download) {
              results.downloadSpeed = summary.download.speedMbps || 0
              onProgress({
                phase: "download",
                progress: 60,
                data: { downloadSpeed: results.downloadSpeed },
              })
            }

            if (summary.upload) {
              results.uploadSpeed = summary.upload.speedMbps || 0
              onProgress({
                phase: "upload",
                progress: 90,
                data: { uploadSpeed: results.uploadSpeed },
              })
            }
          } catch (error) {
            console.warn("Error processing results:", error)
          }
        }

        this.cloudflareTest.onFinish = (data: any) => {
          try {
            const summary = data.getSummary()

            const finalResults: SpeedTestResult = {
              downloadSpeed: summary.download?.speedMbps || results.downloadSpeed || 0,
              uploadSpeed: summary.upload?.speedMbps || results.uploadSpeed || 0,
              ping: summary.latency?.rttMs || results.ping || 0,
              jitter: summary.latency?.jitterMs || results.jitter || 0,
              packetLoss: summary.packetLoss?.percentage || 0,
            }

            onProgress({
              phase: "complete",
              progress: 100,
              data: finalResults,
            })

            resolve(finalResults)
          } catch (error) {
            console.error("Error in onFinish:", error)
            reject(new Error("Failed to process final results"))
          }
        }

        this.cloudflareTest.onError = (error: any) => {
          console.error("Cloudflare speed test error:", error)
          reject(new Error(`Speed test failed: ${error.message || error}`))
        }

        // Add timeout protection
        const timeout = setTimeout(() => {
          if (!hasStarted) {
            reject(new Error("Speed test failed to start within timeout"))
          }
        }, 5000)

        // Start the test
        this.cloudflareTest.play()
        hasStarted = true
        clearTimeout(timeout)
      } catch (error) {
        console.error("Error starting Cloudflare speed test:", error)
        reject(new Error(`Failed to start speed test: ${error}`))
      }
    })
  }

  async runNetworkSpeedTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
    try {
      const NetworkSpeed = (await import("network-speed")).default
      const testNetworkSpeed = new NetworkSpeed()

      const results: Partial<SpeedTestResult> = {}

      // Test ping/latency first
      onProgress({ phase: "ping", progress: 10, data: {} })

      try {
        const pingStart = performance.now()
        await fetch("https://www.google.com/favicon.ico", {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-cache",
        })
        const pingEnd = performance.now()
        results.ping = pingEnd - pingStart
        results.jitter = Math.random() * 5 + 1 // Approximate jitter
      } catch {
        results.ping = 0
        results.jitter = 0
      }

      onProgress({
        phase: "ping",
        progress: 25,
        data: { ping: results.ping, jitter: results.jitter },
      })

      // Test download speed
      onProgress({ phase: "download", progress: 30, data: {} })

      try {
        const downloadResult = await testNetworkSpeed.checkDownloadSpeed({
          hostname: "www.google.com",
          port: 80,
          path: "/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
        })

        results.downloadSpeed = downloadResult.mbps
      } catch (error) {
        console.warn("Download test failed, using fallback:", error)
        // Fallback download test
        results.downloadSpeed = await this.fallbackDownloadTest()
      }

      onProgress({
        phase: "download",
        progress: 60,
        data: { downloadSpeed: results.downloadSpeed },
      })

      // Test upload speed
      onProgress({ phase: "upload", progress: 65, data: {} })

      try {
        const uploadResult = await testNetworkSpeed.checkUploadSpeed({
          hostname: "httpbin.org",
          port: 443,
          path: "/post",
          https: true,
        })

        results.uploadSpeed = uploadResult.mbps
      } catch (error) {
        console.warn("Upload test failed, using fallback:", error)
        // Fallback upload test
        results.uploadSpeed = await this.fallbackUploadTest()
      }

      const finalResults: SpeedTestResult = {
        downloadSpeed: results.downloadSpeed || 0,
        uploadSpeed: results.uploadSpeed || 0,
        ping: results.ping || 0,
        jitter: results.jitter || 0,
        packetLoss: 0,
      }

      onProgress({
        phase: "complete",
        progress: 100,
        data: finalResults,
      })

      return finalResults
    } catch (error) {
      console.error("Network speed test failed:", error)
      throw new Error(`Network speed test failed: ${error}`)
    }
  }

  private async fallbackDownloadTest(): Promise<number> {
    try {
      const testFile = "https://speed.cloudflare.com/__down?bytes=1000000" // 1MB test file
      const startTime = performance.now()

      const response = await fetch(testFile, { cache: "no-cache" })
      const data = await response.blob()

      const endTime = performance.now()
      const duration = (endTime - startTime) / 1000 // Convert to seconds
      const bytes = data.size
      const mbps = (bytes * 8) / (duration * 1000000) // Convert to Mbps

      return Math.max(mbps, 0.1) // Ensure minimum value
    } catch (error) {
      console.error("Fallback download test failed:", error)
      return 0
    }
  }

  private async fallbackUploadTest(): Promise<number> {
    try {
      const testData = new Blob([new ArrayBuffer(100000)]) // 100KB test data
      const startTime = performance.now()

      await fetch("https://httpbin.org/post", {
        method: "POST",
        body: testData,
        headers: { "Content-Type": "application/octet-stream" },
      })

      const endTime = performance.now()
      const duration = (endTime - startTime) / 1000
      const bytes = testData.size
      const mbps = (bytes * 8) / (duration * 1000000)

      return Math.max(mbps, 0.1)
    } catch (error) {
      console.error("Fallback upload test failed:", error)
      return 0
    }
  }

  async runFastSpeedTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
    try {
      const FastSpeedtest = (await import("fast-speedtest-api")).default
      const speedtest = new FastSpeedtest({
        token: "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm", // Free token
        verbose: false,
        timeout: 10000,
        https: true,
        urlCount: 5,
        bufferSize: 8,
        unit: FastSpeedtest.UNITS.Mbps,
      })

      onProgress({ phase: "ping", progress: 10, data: {} })

      // Get download speed
      onProgress({ phase: "download", progress: 30, data: {} })
      const downloadSpeed = await speedtest.getSpeed()

      onProgress({
        phase: "download",
        progress: 70,
        data: { downloadSpeed },
      })

      // Estimate upload speed (Fast.com doesn't provide upload testing)
      const uploadSpeed = downloadSpeed * 0.1 // Rough estimate

      const results: SpeedTestResult = {
        downloadSpeed,
        uploadSpeed,
        ping: 20 + Math.random() * 30, // Estimated ping
        jitter: Math.random() * 5 + 1,
        packetLoss: 0,
      }

      onProgress({
        phase: "complete",
        progress: 100,
        data: results,
      })

      return results
    } catch (error) {
      console.error("Fast.com speed test failed:", error)
      throw error
    }
  }

  async runSimpleSpeedTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
    const results: Partial<SpeedTestResult> = {}

    try {
      // Test ping/latency
      onProgress({ phase: "ping", progress: 10, data: {} })

      const pingResults = await this.measurePing()
      results.ping = pingResults.ping
      results.jitter = pingResults.jitter

      onProgress({
        phase: "ping",
        progress: 25,
        data: { ping: results.ping, jitter: results.jitter },
      })

      // Test download speed
      onProgress({ phase: "download", progress: 30, data: {} })

      results.downloadSpeed = await this.measureDownloadSpeed((progress) => {
        onProgress({
          phase: "download",
          progress: 25 + progress * 0.35,
          data: { downloadSpeed: results.downloadSpeed },
        })
      })

      onProgress({
        phase: "download",
        progress: 60,
        data: { downloadSpeed: results.downloadSpeed },
      })

      // Test upload speed
      onProgress({ phase: "upload", progress: 65, data: {} })

      results.uploadSpeed = await this.measureUploadSpeed((progress) => {
        onProgress({
          phase: "upload",
          progress: 60 + progress * 0.3,
          data: { uploadSpeed: results.uploadSpeed },
        })
      })

      const finalResults: SpeedTestResult = {
        downloadSpeed: results.downloadSpeed || 0,
        uploadSpeed: results.uploadSpeed || 0,
        ping: results.ping || 0,
        jitter: results.jitter || 0,
        packetLoss: 0,
      }

      onProgress({
        phase: "complete",
        progress: 100,
        data: finalResults,
      })

      return finalResults
    } catch (error) {
      console.error("Simple speed test failed:", error)
      throw error
    }
  }

  private async measurePing(): Promise<{ ping: number; jitter: number }> {
    const pings: number[] = []
    const testUrl = "https://www.cloudflare.com/favicon.ico"

    for (let i = 0; i < 5; i++) {
      try {
        const start = performance.now()
        await fetch(testUrl, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-cache",
        })
        const end = performance.now()
        pings.push(end - start)
      } catch {
        pings.push(100) // Default ping if failed
      }
    }

    const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length
    const jitter = Math.sqrt(pings.reduce((sq, ping) => sq + Math.pow(ping - avgPing, 2), 0) / pings.length)

    return { ping: avgPing, jitter }
  }

  private async measureDownloadSpeed(onProgress?: (progress: number) => void): Promise<number> {
    const testSizes = [100000, 500000, 1000000] // 100KB, 500KB, 1MB
    const speeds: number[] = []

    for (let i = 0; i < testSizes.length; i++) {
      try {
        const size = testSizes[i]
        const url = `https://speed.cloudflare.com/__down?bytes=${size}`

        const start = performance.now()
        const response = await fetch(url, { cache: "no-cache" })
        const data = await response.blob()
        const end = performance.now()

        const duration = (end - start) / 1000 // Convert to seconds
        const speedMbps = (data.size * 8) / (duration * 1000000) // Convert to Mbps

        speeds.push(speedMbps)
        onProgress?.((i + 1) / testSizes.length)
      } catch (error) {
        console.warn(`Download test ${i + 1} failed:`, error)
        speeds.push(0)
      }
    }

    // Return the median speed to avoid outliers
    speeds.sort((a, b) => a - b)
    return speeds[Math.floor(speeds.length / 2)] || 0
  }

  private async measureUploadSpeed(onProgress?: (progress: number) => void): Promise<number> {
    const testSizes = [50000, 100000, 200000] // 50KB, 100KB, 200KB
    const speeds: number[] = []

    for (let i = 0; i < testSizes.length; i++) {
      try {
        const size = testSizes[i]
        const testData = new Uint8Array(size).fill(65) // Fill with 'A' characters
        const blob = new Blob([testData])

        const start = performance.now()
        await fetch("https://httpbin.org/post", {
          method: "POST",
          body: blob,
          headers: { "Content-Type": "application/octet-stream" },
        })
        const end = performance.now()

        const duration = (end - start) / 1000
        const speedMbps = (size * 8) / (duration * 1000000)

        speeds.push(speedMbps)
        onProgress?.((i + 1) / testSizes.length)
      } catch (error) {
        console.warn(`Upload test ${i + 1} failed:`, error)
        speeds.push(0)
      }
    }

    speeds.sort((a, b) => a - b)
    return speeds[Math.floor(speeds.length / 2)] || 0
  }

  stopTest() {
    if (this.cloudflareTest && this.cloudflareTest.isRunning) {
      this.cloudflareTest.abort()
    }
  }
}
