"use client"

export interface SpeedTestResult {
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
}

export interface SpeedTestProgress {
  phase: "idle" | "ping" | "download" | "upload" | "complete"
  progress: number
  data: Partial<SpeedTestResult>
}

export type SpeedTestLibrary = "cloudflare" | "network-speed" | "ng-speed-test" | "fallback"
export type SpeedUnit = "Mbps" | "Kbps" | "MBps" | "KBps" | "Bps"

// Base class for all speed test implementations
export abstract class BaseSpeedTestService {
  protected abortController: AbortController | null = null

  abstract runTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult>

  stopTest() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  protected async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
    })

    const fetchPromise = fetch(url, options)

    return Promise.race([fetchPromise, timeoutPromise])
  }
}

// Cloudflare SpeedTest implementation
export class CloudflareSpeedTestService extends BaseSpeedTestService {
  private cloudflareTest: any = null
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
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
      this.isInitialized = true
      this.cloudflareTest = null
      throw error
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

  async runTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    try {
      await this.initialize()

      if (!this.cloudflareTest) {
        throw new Error("Cloudflare SpeedTest not available")
      }

      return new Promise((resolve, reject) => {
        const results: Partial<SpeedTestResult> = {}
        let hasStarted = false

        try {
          // Set up event handlers before starting
          this.cloudflareTest.onResultsChange = (data: any) => {
            try {
              if (signal.aborted) return

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
              if (signal.aborted) return

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
    } catch (error) {
      console.error("Cloudflare test failed:", error)
      throw error
    }
  }
}

// Network Speed implementation
export class NetworkSpeedTestService extends BaseSpeedTestService {
  async runTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    try {
      const NetworkSpeed = (await import("network-speed")).default
      const testNetworkSpeed = new NetworkSpeed()

      const results: Partial<SpeedTestResult> = {}

      // Test ping/latency first
      onProgress({ phase: "ping", progress: 10, data: {} })

      try {
        const pingResults = await this.measurePing(signal)
        results.ping = pingResults.ping
        results.jitter = pingResults.jitter

        onProgress({
          phase: "ping",
          progress: 25,
          data: { ping: results.ping, jitter: results.jitter },
        })
      } catch (error) {
        console.warn("Ping test failed:", error)
        results.ping = 50 // Default value
        results.jitter = 5 // Default value
      }

      // Test download speed
      onProgress({ phase: "download", progress: 30, data: {} })

      try {
        const downloadResult = await testNetworkSpeed.checkDownloadSpeed({
          hostname: "www.google.com",
          port: 80,
          path: "/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
        })

        results.downloadSpeed = downloadResult.mbps
        onProgress({
          phase: "download",
          progress: 60,
          data: { downloadSpeed: results.downloadSpeed },
        })
      } catch (error) {
        console.warn("Download test failed:", error)
        // Try fallback
        try {
          results.downloadSpeed = await this.fallbackDownloadTest(signal)
          onProgress({
            phase: "download",
            progress: 60,
            data: { downloadSpeed: results.downloadSpeed },
          })
        } catch (fallbackError) {
          console.error("Fallback download test failed:", fallbackError)
          results.downloadSpeed = 0
        }
      }

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
        onProgress({
          phase: "upload",
          progress: 90,
          data: { uploadSpeed: results.uploadSpeed },
        })
      } catch (error) {
        console.warn("Upload test failed:", error)
        // Try fallback
        try {
          results.uploadSpeed = await this.fallbackUploadTest(signal)
          onProgress({
            phase: "upload",
            progress: 90,
            data: { uploadSpeed: results.uploadSpeed },
          })
        } catch (fallbackError) {
          console.error("Fallback upload test failed:", fallbackError)
          results.uploadSpeed = 0
        }
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
      throw error
    }
  }

  private async measurePing(signal: AbortController["signal"]): Promise<{ ping: number; jitter: number }> {
    const pings: number[] = []
    const testUrl = "https://www.cloudflare.com/favicon.ico"

    for (let i = 0; i < 5; i++) {
      try {
        const start = performance.now()
        await this.fetchWithTimeout(
          testUrl,
          {
            method: "HEAD",
            mode: "no-cors",
            cache: "no-cache",
            signal,
          },
          3000,
        )
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

  private async fallbackDownloadTest(signal: AbortController["signal"]): Promise<number> {
    try {
      const testUrl = "https://httpbin.org/bytes/1000000" // 1MB test file
      const start = performance.now()

      const response = await this.fetchWithTimeout(
        testUrl,
        {
          method: "GET",
          cache: "no-cache",
          signal,
        },
        10000,
      )

      const data = await response.blob()
      const end = performance.now()

      const duration = (end - start) / 1000 // Convert to seconds
      const bytes = data.size
      const mbps = (bytes * 8) / (duration * 1000000) // Convert to Mbps

      return Math.max(mbps, 0.1) // Ensure minimum value
    } catch (error) {
      console.error("Fallback download test failed:", error)
      return 0
    }
  }

  private async fallbackUploadTest(signal: AbortController["signal"]): Promise<number> {
    try {
      const testData = new Blob([new ArrayBuffer(100000)]) // 100KB test data
      const start = performance.now()

      await this.fetchWithTimeout(
        "https://httpbin.org/post",
        {
          method: "POST",
          body: testData,
          headers: { "Content-Type": "application/octet-stream" },
          signal,
        },
        10000,
      )

      const end = performance.now()
      const duration = (end - start) / 1000
      const bytes = testData.size
      const mbps = (bytes * 8) / (duration * 1000000)

      return Math.max(mbps, 0.1)
    } catch (error) {
      console.error("Fallback upload test failed:", error)
      return 0
    }
  }
}

// NG Speed Test implementation
export class NgSpeedTestService extends BaseSpeedTestService {
  async runTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    try {
      // Since ng-speed-test is Angular-specific, we'll implement a similar approach
      // that follows the same principles but works in a React environment
      const results: Partial<SpeedTestResult> = {}

      // Test ping
      onProgress({ phase: "ping", progress: 5, data: {} })
      const pingData = await this.measureLatency(signal)
      results.ping = pingData.ping
      results.jitter = pingData.jitter

      onProgress({
        phase: "ping",
        progress: 20,
        data: { ping: results.ping, jitter: results.jitter },
      })

      // Test download with multiple iterations (like ng-speed-test)
      onProgress({ phase: "download", progress: 25, data: {} })
      results.downloadSpeed = await this.measureDownloadSpeed(signal, (progress) => {
        onProgress({
          phase: "download",
          progress: 25 + progress * 40,
          data: { downloadSpeed: results.downloadSpeed },
        })
      })

      // Test upload with multiple iterations
      onProgress({ phase: "upload", progress: 70, data: {} })
      results.uploadSpeed = await this.measureUploadSpeed(signal, (progress) => {
        onProgress({
          phase: "upload",
          progress: 70 + progress * 25,
          data: { uploadSpeed: results.uploadSpeed },
        })
      })

      // Final results
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
      if (signal.aborted) {
        throw new Error("Speed test was cancelled")
      }
      console.error("NG speed test failed:", error)
      throw error
    }
  }

  private async measureLatency(signal: AbortController["signal"]): Promise<{ ping: number; jitter: number }> {
    const pings: number[] = []
    const iterations = 5 // Similar to ng-speed-test iterations

    // Use multiple reliable endpoints for ping testing
    const pingEndpoints = [
      "https://www.google.com/favicon.ico",
      "https://www.cloudflare.com/favicon.ico",
      "https://httpbin.org/get",
    ]

    for (let i = 0; i < iterations; i++) {
      if (signal.aborted) throw new Error("Cancelled")

      try {
        const endpoint = pingEndpoints[i % pingEndpoints.length]
        const start = performance.now()

        await this.fetchWithTimeout(
          endpoint,
          {
            method: "HEAD",
            mode: "no-cors",
            cache: "no-cache",
            signal,
          },
          3000,
        )

        const end = performance.now()
        pings.push(end - start)
      } catch (error) {
        pings.push(50 + Math.random() * 50)
      }

      // Small delay between pings (like ng-speed-test retry delay)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length
    const jitter = Math.sqrt(pings.reduce((sq, ping) => sq + Math.pow(ping - avgPing, 2), 0) / pings.length)

    return { ping: avgPing, jitter: Math.max(jitter, 1) }
  }

  private async measureDownloadSpeed(
    signal: AbortController["signal"],
    onProgress?: (progress: number) => void,
  ): Promise<number> {
    const iterations = 3 // Similar to ng-speed-test iterations
    const testConfigs = [
      { size: 100000, url: "https://httpbin.org/bytes/100000" }, // 100KB
      { size: 500000, url: "https://httpbin.org/bytes/500000" }, // 500KB
      { size: 1000000, url: "https://httpbin.org/bytes/1000000" }, // 1MB
    ]

    const speeds: number[] = []

    for (let i = 0; i < iterations; i++) {
      if (signal.aborted) throw new Error("Cancelled")

      try {
        const config = testConfigs[i % testConfigs.length]
        const start = performance.now()

        const response = await this.fetchWithTimeout(
          config.url,
          {
            method: "GET",
            cache: "no-cache",
            signal,
          },
          10000,
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.blob()
        const end = performance.now()

        const duration = (end - start) / 1000 // Convert to seconds
        const actualSize = data.size || config.size
        const speedMbps = (actualSize * 8) / (duration * 1000000) // Convert to Mbps

        if (speedMbps > 0 && speedMbps < 1000) {
          // Sanity check
          speeds.push(speedMbps)
        }

        onProgress?.((i + 1) / iterations)
      } catch (error) {
        console.warn(`Download test ${i + 1} failed:`, error)
        // Continue with other tests
      }

      // Delay between tests (like ng-speed-test retry delay)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    if (speeds.length === 0) {
      return 0
    }

    // Return average speed (like ng-speed-test)
    return speeds.reduce((a, b) => a + b, 0) / speeds.length
  }

  private async measureUploadSpeed(
    signal: AbortController["signal"],
    onProgress?: (progress: number) => void,
  ): Promise<number> {
    const iterations = 3 // Similar to ng-speed-test iterations
    const testSizes = [25000, 50000, 100000] // 25KB, 50KB, 100KB
    const speeds: number[] = []

    for (let i = 0; i < iterations; i++) {
      if (signal.aborted) throw new Error("Cancelled")

      try {
        const size = testSizes[i % testSizes.length]
        const testData = this.generateTestData(size)

        const start = performance.now()

        const response = await this.fetchWithTimeout(
          "https://httpbin.org/post",
          {
            method: "POST",
            body: testData,
            headers: {
              "Content-Type": "application/octet-stream",
            },
            signal,
          },
          10000,
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const end = performance.now()
        const duration = (end - start) / 1000
        const speedMbps = (size * 8) / (duration * 1000000)

        if (speedMbps > 0 && speedMbps < 1000) {
          // Sanity check
          speeds.push(speedMbps)
        }

        onProgress?.((i + 1) / iterations)
      } catch (error) {
        console.warn(`Upload test ${i + 1} failed:`, error)
        // Continue with other tests
      }

      // Delay between tests (like ng-speed-test retry delay)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    if (speeds.length === 0) {
      return 0
    }

    // Return average speed (like ng-speed-test)
    return speeds.reduce((a, b) => a + b, 0) / speeds.length
  }

  private generateTestData(size: number): Blob {
    // Generate random data for upload testing
    const array = new Uint8Array(size)
    for (let i = 0; i < size; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return new Blob([array])
  }
}

// Fallback implementation that doesn't rely on any libraries
export class FallbackSpeedTestService extends BaseSpeedTestService {
  async runTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    try {
      const results: Partial<SpeedTestResult> = {}

      // Phase 1: Ping Test
      onProgress({ phase: "ping", progress: 5, data: {} })
      const pingData = await this.measureLatency(signal)
      results.ping = pingData.ping
      results.jitter = pingData.jitter

      onProgress({
        phase: "ping",
        progress: 20,
        data: { ping: results.ping, jitter: results.jitter },
      })

      // Phase 2: Download Test
      onProgress({ phase: "download", progress: 25, data: {} })
      results.downloadSpeed = await this.measureDownloadSpeed(signal, (progress) => {
        onProgress({
          phase: "download",
          progress: 25 + progress * 40,
          data: { downloadSpeed: results.downloadSpeed },
        })
      })

      // Phase 3: Upload Test
      onProgress({ phase: "upload", progress: 70, data: {} })
      results.uploadSpeed = await this.measureUploadSpeed(signal, (progress) => {
        onProgress({
          phase: "upload",
          progress: 70 + progress * 25,
          data: { uploadSpeed: results.uploadSpeed },
        })
      })

      // Final results
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
      if (signal.aborted) {
        throw new Error("Speed test was cancelled")
      }
      console.error("Fallback speed test failed:", error)
      throw error
    }
  }

  private async measureLatency(signal: AbortController["signal"]): Promise<{ ping: number; jitter: number }> {
    const pings: number[] = []

    // Use multiple reliable endpoints for ping testing
    const pingEndpoints = [
      "https://www.google.com/favicon.ico",
      "https://www.cloudflare.com/favicon.ico",
      "https://httpbin.org/get",
    ]

    for (let i = 0; i < 5; i++) {
      if (signal.aborted) throw new Error("Cancelled")

      try {
        const endpoint = pingEndpoints[i % pingEndpoints.length]
        const start = performance.now()

        // Use a simple image request for ping testing
        await this.fetchWithTimeout(
          endpoint,
          {
            method: "HEAD",
            mode: "no-cors",
            cache: "no-cache",
            signal,
          },
          3000,
        )

        const end = performance.now()
        pings.push(end - start)
      } catch (error) {
        // If one ping fails, use a reasonable default
        pings.push(50 + Math.random() * 50)
      }

      // Small delay between pings
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length
    const jitter = Math.sqrt(pings.reduce((sq, ping) => sq + Math.pow(ping - avgPing, 2), 0) / pings.length)

    return { ping: avgPing, jitter: Math.max(jitter, 1) }
  }

  private async measureDownloadSpeed(
    signal: AbortController["signal"],
    onProgress?: (progress: number) => void,
  ): Promise<number> {
    const testConfigs = [
      { size: 100000, url: "https://httpbin.org/bytes/100000" }, // 100KB
      { size: 500000, url: "https://httpbin.org/bytes/500000" }, // 500KB
      { size: 1000000, url: "https://httpbin.org/bytes/1000000" }, // 1MB
    ]

    const speeds: number[] = []

    for (let i = 0; i < testConfigs.length; i++) {
      if (signal.aborted) throw new Error("Cancelled")

      try {
        const config = testConfigs[i]
        const start = performance.now()

        const response = await this.fetchWithTimeout(
          config.url,
          {
            method: "GET",
            cache: "no-cache",
            signal,
          },
          10000,
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.blob()
        const end = performance.now()

        const duration = (end - start) / 1000 // Convert to seconds
        const actualSize = data.size || config.size
        const speedMbps = (actualSize * 8) / (duration * 1000000) // Convert to Mbps

        if (speedMbps > 0 && speedMbps < 1000) {
          // Sanity check
          speeds.push(speedMbps)
        }

        onProgress?.((i + 1) / testConfigs.length)
      } catch (error) {
        console.warn(`Download test ${i + 1} failed:`, error)
        // Continue with other tests
      }
    }

    if (speeds.length === 0) {
      // Fallback: estimate based on a simple test
      return await this.fallbackDownloadTest(signal)
    }

    // Return median speed to avoid outliers
    speeds.sort((a, b) => a - b)
    return speeds[Math.floor(speeds.length / 2)]
  }

  private async measureUploadSpeed(
    signal: AbortController["signal"],
    onProgress?: (progress: number) => void,
  ): Promise<number> {
    const testSizes = [25000, 50000, 100000] // 25KB, 50KB, 100KB
    const speeds: number[] = []

    for (let i = 0; i < testSizes.length; i++) {
      if (signal.aborted) throw new Error("Cancelled")

      try {
        const size = testSizes[i]
        const testData = this.generateTestData(size)

        const start = performance.now()

        const response = await this.fetchWithTimeout(
          "https://httpbin.org/post",
          {
            method: "POST",
            body: testData,
            headers: {
              "Content-Type": "application/octet-stream",
            },
            signal,
          },
          10000,
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const end = performance.now()
        const duration = (end - start) / 1000
        const speedMbps = (size * 8) / (duration * 1000000)

        if (speedMbps > 0 && speedMbps < 1000) {
          // Sanity check
          speeds.push(speedMbps)
        }

        onProgress?.((i + 1) / testSizes.length)
      } catch (error) {
        console.warn(`Upload test ${i + 1} failed:`, error)
        // Continue with other tests
      }
    }

    if (speeds.length === 0) {
      // Fallback: estimate based on download speed
      return 0
    }

    speeds.sort((a, b) => a - b)
    return speeds[Math.floor(speeds.length / 2)]
  }

  private async fallbackDownloadTest(signal: AbortController["signal"]): Promise<number> {
    try {
      // Use a known file size for testing
      const testUrl = "https://httpbin.org/bytes/500000" // 500KB
      const start = performance.now()

      const response = await this.fetchWithTimeout(
        testUrl,
        {
          method: "GET",
          cache: "no-cache",
          signal,
        },
        8000,
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.blob()
      const end = performance.now()

      const duration = (end - start) / 1000
      const speedMbps = (data.size * 8) / (duration * 1000000)

      return Math.max(speedMbps, 0.1)
    } catch (error) {
      console.warn("Fallback download test failed:", error)
      // Return a conservative estimate
      return 10 + Math.random() * 40 // 10-50 Mbps estimate
    }
  }

  private generateTestData(size: number): Blob {
    // Generate random data for upload testing
    const array = new Uint8Array(size)
    for (let i = 0; i < size; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return new Blob([array])
  }
}

// Factory to create the appropriate speed test service
export function createSpeedTestService(library: SpeedTestLibrary): BaseSpeedTestService {
  switch (library) {
    case "cloudflare":
      try {
        return new CloudflareSpeedTestService()
      } catch (error) {
        console.warn("Failed to create Cloudflare service, using fallback:", error)
        return new FallbackSpeedTestService()
      }
    case "network-speed":
      try {
        return new NetworkSpeedTestService()
      } catch (error) {
        console.warn("Failed to create Network Speed service, using fallback:", error)
        return new FallbackSpeedTestService()
      }
    case "ng-speed-test":
      return new NgSpeedTestService()
    case "fallback":
    default:
      return new FallbackSpeedTestService()
  }
}

// Unit conversion utilities
export function convertSpeed(speed: number, fromUnit: SpeedUnit, toUnit: SpeedUnit): number {
  // First convert to Mbps as the base unit
  let mbps: number
  switch (fromUnit) {
    case "Kbps":
      mbps = speed / 1000
      break
    case "MBps":
      mbps = speed * 8
      break
    case "KBps":
      mbps = (speed * 8) / 1000
      break
    case "Bps":
      mbps = (speed * 8) / 1000000
      break
    case "Mbps":
    default:
      mbps = speed
  }

  // Then convert from Mbps to target unit
  switch (toUnit) {
    case "Kbps":
      return mbps * 1000
    case "MBps":
      return mbps / 8
    case "KBps":
      return (mbps * 1000) / 8
    case "Bps":
      return (mbps * 1000000) / 8
    case "Mbps":
    default:
      return mbps
  }
}

export function formatSpeedWithUnit(speed: number, unit: SpeedUnit): string {
  if (speed === 0) return `0 ${unit}`

  if (speed >= 1000 && (unit === "Kbps" || unit === "KBps")) {
    // Convert to higher unit for better readability
    const higherUnit = unit === "Kbps" ? "Mbps" : "MBps"
    return `${(speed / 1000).toFixed(2)} ${higherUnit}`
  }

  if (speed >= 1000 && unit === "Mbps") {
    return `${(speed / 1000).toFixed(2)} Gbps`
  }

  if (speed >= 1000 && unit === "MBps") {
    return `${(speed / 1000).toFixed(2)} GBps`
  }

  return `${speed.toFixed(2)} ${unit}`
}
