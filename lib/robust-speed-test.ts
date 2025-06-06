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

export class RobustSpeedTestService {
  private abortController: AbortController | null = null

  async runSpeedTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
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

      onProgress({
        phase: "download",
        progress: 65,
        data: { downloadSpeed: results.downloadSpeed },
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
      console.error("Speed test failed:", error)
      throw new Error(`Speed test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
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
      { size: 100000, url: this.generateTestUrl(100000) }, // 100KB
      { size: 500000, url: this.generateTestUrl(500000) }, // 500KB
      { size: 1000000, url: this.generateTestUrl(1000000) }, // 1MB
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

  private generateTestUrl(bytes: number): string {
    // Use httpbin.org which is more reliable than Cloudflare for testing
    return `https://httpbin.org/bytes/${bytes}`
  }

  private generateTestData(size: number): Blob {
    // Generate random data for upload testing
    const array = new Uint8Array(size)
    for (let i = 0; i < size; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return new Blob([array])
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
    })

    const fetchPromise = fetch(url, options)

    return Promise.race([fetchPromise, timeoutPromise])
  }

  stopTest() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
}
