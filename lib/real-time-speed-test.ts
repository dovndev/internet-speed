"use client"

import { BaseSpeedTestService, type SpeedTestProgress, type SpeedTestResult } from "./speed-test-libraries"

export interface RealTimeSpeedTestOptions {
  downloadSizes: number[]
  uploadSizes: number[]
  pingIterations: number
  downloadEndpoint: string
  uploadEndpoint: string
  pingEndpoints: string[]
  progressInterval: number
}

export class RealTimeSpeedTestService extends BaseSpeedTestService {
  private options: RealTimeSpeedTestOptions
  private isRunning = false
  private lastProgressUpdate = 0
  private currentPhase: "idle" | "ping" | "download" | "upload" | "complete" = "idle"
  private results: Partial<SpeedTestResult> = {}
  private downloadSpeeds: number[] = []
  private uploadSpeeds: number[] = []
  private pings: number[] = []
  private pingDiffs: number[] = []

  constructor(options?: Partial<RealTimeSpeedTestOptions>) {
    super()
    this.options = {
      downloadSizes: [100000, 500000, 1000000, 2000000], // Bytes
      uploadSizes: [50000, 100000, 200000, 500000], // Bytes
      pingIterations: 10,
      downloadEndpoint: "https://httpbin.org/bytes/",
      uploadEndpoint: "https://httpbin.org/post",
      pingEndpoints: [
        "https://www.google.com/favicon.ico",
        "https://www.cloudflare.com/favicon.ico",
        "https://httpbin.org/get",
      ],
      progressInterval: 200, // ms
      ...options,
    }
  }

  async runTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
    this.abortController = new AbortController()
    const signal = this.abortController.signal
    this.isRunning = true
    this.lastProgressUpdate = 0
    this.currentPhase = "idle"
    this.results = {}
    this.downloadSpeeds = []
    this.uploadSpeeds = []
    this.pings = []
    this.pingDiffs = []

    try {
      // Phase 1: Ping Test
      this.currentPhase = "ping"
      this.updateProgress(5, onProgress)

      await this.runPingTest(signal, (progress, data) => {
        this.updateProgress(5 + progress * 20, onProgress, data)
      })

      // Phase 2: Download Test
      this.currentPhase = "download"
      this.updateProgress(25, onProgress)

      await this.runDownloadTest(signal, (progress, data) => {
        this.updateProgress(25 + progress * 40, onProgress, data)
      })

      // Phase 3: Upload Test
      this.currentPhase = "upload"
      this.updateProgress(65, onProgress)

      await this.runUploadTest(signal, (progress, data) => {
        this.updateProgress(65 + progress * 35, onProgress, data)
      })

      // Final results
      this.currentPhase = "complete"

      const finalResults: SpeedTestResult = {
        downloadSpeed: this.results.downloadSpeed || 0,
        uploadSpeed: this.results.uploadSpeed || 0,
        ping: this.results.ping || 0,
        jitter: this.results.jitter || 0,
        packetLoss: this.results.packetLoss || 0,
      }

      this.updateProgress(100, onProgress, finalResults)
      this.isRunning = false
      return finalResults
    } catch (error) {
      this.isRunning = false
      if (signal.aborted) {
        throw new Error("Speed test was cancelled")
      }
      console.error("Real-time speed test failed:", error)
      throw error
    }
  }

  private updateProgress(
    progress: number,
    onProgress: (progress: SpeedTestProgress) => void,
    data?: Partial<SpeedTestResult>,
  ) {
    const now = Date.now()

    // Only update at most every progressInterval ms, unless it's the first or last update
    if (
      now - this.lastProgressUpdate >= this.options.progressInterval ||
      progress <= 5 ||
      progress >= 100 ||
      this.lastProgressUpdate === 0
    ) {
      this.lastProgressUpdate = now

      onProgress({
        phase: this.currentPhase,
        progress,
        data: {
          ...this.results,
          ...data,
        },
      })
    }
  }

  private async runPingTest(
    signal: AbortController["signal"],
    onPingProgress: (progress: number, data: Partial<SpeedTestResult>) => void,
  ): Promise<void> {
    const { pingEndpoints, pingIterations } = this.options
    let successfulPings = 0
    let failedPings = 0

    for (let i = 0; i < pingIterations; i++) {
      if (signal.aborted || !this.isRunning) break

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
        const pingTime = end - start
        this.pings.push(pingTime)
        successfulPings++

        // Calculate jitter if we have at least 2 pings
        if (this.pings.length >= 2) {
          const diff = Math.abs(this.pings[this.pings.length - 1] - this.pings[this.pings.length - 2])
          this.pingDiffs.push(diff)

          const avgPing = this.pings.reduce((sum, p) => sum + p, 0) / this.pings.length
          const avgJitter = this.pingDiffs.reduce((sum, d) => sum + d, 0) / this.pingDiffs.length

          this.results.ping = avgPing
          this.results.jitter = avgJitter
        } else {
          this.results.ping = pingTime
          this.results.jitter = 0
        }
      } catch (error) {
        failedPings++
      }

      // Calculate packet loss
      const totalPings = successfulPings + failedPings
      this.results.packetLoss = (failedPings / totalPings) * 100

      // Report progress
      onPingProgress((i + 1) / pingIterations, {
        ping: this.results.ping,
        jitter: this.results.jitter,
        packetLoss: this.results.packetLoss,
      })

      // Small delay between pings
      if (i < pingIterations - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }
  }

  private async runDownloadTest(
    signal: AbortController["signal"],
    onDownloadProgress: (progress: number, data: Partial<SpeedTestResult>) => void,
  ): Promise<void> {
    const { downloadSizes, downloadEndpoint } = this.options

    for (let i = 0; i < downloadSizes.length; i++) {
      if (signal.aborted || !this.isRunning) break

      try {
        const size = downloadSizes[i]
        const url = `${downloadEndpoint}${size}`
        const start = performance.now()

        const response = await this.fetchWithTimeout(
          url,
          {
            method: "GET",
            cache: "no-cache",
            signal,
          },
          15000,
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.blob()
        const end = performance.now()

        const duration = (end - start) / 1000 // Convert to seconds
        const actualSize = data.size || size
        const speedMbps = (actualSize * 8) / (duration * 1000000) // Convert to Mbps

        if (speedMbps > 0 && speedMbps < 1000) {
          // Sanity check
          this.downloadSpeeds.push(speedMbps)

          // Calculate average download speed
          const avgSpeed = this.downloadSpeeds.reduce((sum, s) => sum + s, 0) / this.downloadSpeeds.length
          this.results.downloadSpeed = avgSpeed

          // Report progress with current speed
          onDownloadProgress((i + 1) / downloadSizes.length, {
            downloadSpeed: speedMbps, // Report current speed for live updates
          })
        }
      } catch (error) {
        console.warn(`Download test ${i + 1} failed:`, error)
      }

      // Small delay between tests
      if (i < downloadSizes.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Final download speed is the average
    this.results.downloadSpeed =
      this.downloadSpeeds.length > 0
        ? this.downloadSpeeds.reduce((sum, s) => sum + s, 0) / this.downloadSpeeds.length
        : 0
  }

  private async runUploadTest(
    signal: AbortController["signal"],
    onUploadProgress: (progress: number, data: Partial<SpeedTestResult>) => void,
  ): Promise<void> {
    const { uploadSizes, uploadEndpoint } = this.options

    for (let i = 0; i < uploadSizes.length; i++) {
      if (signal.aborted || !this.isRunning) break

      try {
        const size = uploadSizes[i]
        const testData = this.generateTestData(size)

        const start = performance.now()

        const response = await this.fetchWithTimeout(
          uploadEndpoint,
          {
            method: "POST",
            body: testData,
            headers: {
              "Content-Type": "application/octet-stream",
            },
            signal,
          },
          15000,
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const end = performance.now()
        const duration = (end - start) / 1000
        const speedMbps = (size * 8) / (duration * 1000000)

        if (speedMbps > 0 && speedMbps < 1000) {
          // Sanity check
          this.uploadSpeeds.push(speedMbps)

          // Calculate average upload speed
          const avgSpeed = this.uploadSpeeds.reduce((sum, s) => sum + s, 0) / this.uploadSpeeds.length
          this.results.uploadSpeed = avgSpeed

          // Report progress with current speed
          onUploadProgress((i + 1) / uploadSizes.length, {
            uploadSpeed: speedMbps, // Report current speed for live updates
          })
        }
      } catch (error) {
        console.warn(`Upload test ${i + 1} failed:`, error)
      }

      // Small delay between tests
      if (i < uploadSizes.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Final upload speed is the average
    this.results.uploadSpeed =
      this.uploadSpeeds.length > 0 ? this.uploadSpeeds.reduce((sum, s) => sum + s, 0) / this.uploadSpeeds.length : 0
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
