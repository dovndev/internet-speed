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
  liveData?: {
    currentDownload?: number
    currentUpload?: number
    currentPing?: number
    currentJitter?: number
  }
}

export class AccurateSpeedTestService {
  private abortController: AbortController | null = null
  private isRunning = false
  private pingInterval: NodeJS.Timeout | null = null
  private lastPingValue = 0
  private lastJitterValue = 0

  async runSpeedTest(onProgress: (progress: SpeedTestProgress) => void): Promise<SpeedTestResult> {
    this.abortController = new AbortController()
    const signal = this.abortController.signal
    this.isRunning = true

    try {
      const results: Partial<SpeedTestResult> = {}

      // Start continuous ping monitoring
      this.startContinuousPing(signal, onProgress)

      // Phase 1: Ping Test (Improved accuracy)
      onProgress({
        phase: "ping",
        progress: 5,
        data: {},
        liveData: {
          currentPing: this.lastPingValue,
          currentJitter: this.lastJitterValue,
        },
      })

      const pingData = await this.measurePingAccurate(signal, (progress, currentPing, currentJitter) => {
        this.lastPingValue = currentPing
        this.lastJitterValue = currentJitter

        onProgress({
          phase: "ping",
          progress: 5 + progress * 20,
          data: {},
          liveData: {
            currentPing,
            currentJitter,
          },
        })
      })

      results.ping = pingData.ping
      results.jitter = pingData.jitter
      results.packetLoss = pingData.packetLoss

      // Phase 2: Download Test (Multiple servers and sizes)
      onProgress({
        phase: "download",
        progress: 25,
        data: {},
        liveData: {
          currentPing: this.lastPingValue,
          currentJitter: this.lastJitterValue,
          currentDownload: 0,
        },
      })

      results.downloadSpeed = await this.measureDownloadSpeedAccurate(signal, (progress, speed) => {
        onProgress({
          phase: "download",
          progress: 25 + progress * 40,
          data: {},
          liveData: {
            currentPing: this.lastPingValue,
            currentJitter: this.lastJitterValue,
            currentDownload: speed,
          },
        })
      })

      // Phase 3: Upload Test (Improved methodology)
      onProgress({
        phase: "upload",
        progress: 65,
        data: {},
        liveData: {
          currentPing: this.lastPingValue,
          currentJitter: this.lastJitterValue,
          currentDownload: results.downloadSpeed,
          currentUpload: 0,
        },
      })

      results.uploadSpeed = await this.measureUploadSpeedAccurate(signal, (progress, speed) => {
        onProgress({
          phase: "upload",
          progress: 65 + progress * 30,
          data: {},
          liveData: {
            currentPing: this.lastPingValue,
            currentJitter: this.lastJitterValue,
            currentDownload: results.downloadSpeed,
            currentUpload: speed,
          },
        })
      })

      // Stop continuous ping monitoring
      this.stopContinuousPing()

      const finalResults: SpeedTestResult = {
        downloadSpeed: results.downloadSpeed || 0,
        uploadSpeed: results.uploadSpeed || 0,
        ping: results.ping || 0,
        jitter: results.jitter || 0,
        packetLoss: results.packetLoss || 0,
      }

      onProgress({
        phase: "complete",
        progress: 100,
        data: finalResults,
        liveData: {
          currentPing: finalResults.ping,
          currentJitter: finalResults.jitter,
          currentDownload: finalResults.downloadSpeed,
          currentUpload: finalResults.uploadSpeed,
        },
      })

      return finalResults
    } catch (error) {
      this.stopContinuousPing()
      if (signal.aborted) {
        throw new Error("Speed test was cancelled")
      }
      console.error("Speed test failed:", error)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  private startContinuousPing(signal: AbortController["signal"], onProgress: (progress: SpeedTestProgress) => void) {
    const pingHistory: number[] = []

    this.pingInterval = setInterval(async () => {
      if (signal.aborted) return

      try {
        const start = performance.now()
        await fetch("https://www.google.com/favicon.ico", {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-cache",
        })
        const end = performance.now()
        const pingTime = end - start

        // Keep last 5 pings for jitter calculation
        pingHistory.push(pingTime)
        if (pingHistory.length > 5) pingHistory.shift()

        // Calculate jitter as average deviation between consecutive pings
        let jitter = 0
        if (pingHistory.length > 1) {
          let totalDiff = 0
          for (let i = 1; i < pingHistory.length; i++) {
            totalDiff += Math.abs(pingHistory[i] - pingHistory[i - 1])
          }
          jitter = totalDiff / (pingHistory.length - 1)
        }

        this.lastPingValue = pingTime
        this.lastJitterValue = jitter

        // Update live ping data
        onProgress({
          phase: this.isRunning ? "ping" : "idle",
          progress: 0,
          data: {},
          liveData: {
            currentPing: pingTime,
            currentJitter: jitter,
            currentDownload: onProgress["liveData"]?.currentDownload,
            currentUpload: onProgress["liveData"]?.currentUpload,
          },
        })
      } catch (error) {
        // Ignore ping errors during continuous monitoring
      }
    }, 1000)
  }

  private stopContinuousPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private async measurePingAccurate(
    signal: AbortController["signal"],
    onProgress: (progress: number, currentPing: number, currentJitter: number) => void,
  ): Promise<{ ping: number; jitter: number; packetLoss: number }> {
    const pings: number[] = []
    const testEndpoints = [
      "https://www.google.com/favicon.ico",
      "https://www.cloudflare.com/favicon.ico",
      "https://httpbin.org/get",
      "https://www.github.com/favicon.ico",
      "https://www.microsoft.com/favicon.ico",
    ]

    let successfulPings = 0
    let totalAttempts = 0
    const iterations = 15

    for (let i = 0; i < iterations; i++) {
      if (signal.aborted) throw new Error("Cancelled")

      const endpoint = testEndpoints[i % testEndpoints.length]
      totalAttempts++

      try {
        const start = performance.now()
        await fetch(endpoint, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-cache",
          signal,
        })
        const end = performance.now()
        const pingTime = end - start

        if (pingTime > 0 && pingTime < 5000) {
          pings.push(pingTime)
          successfulPings++

          // Calculate current jitter
          const currentJitter = pings.length > 1 ? Math.abs(pingTime - pings[pings.length - 2]) : 0

          onProgress((i + 1) / iterations, pingTime, currentJitter)
        }
      } catch (error) {
        // Failed ping
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    if (pings.length === 0) {
      return { ping: 0, jitter: 0, packetLoss: 100 }
    }

    pings.sort((a, b) => a - b)
    const trimmedPings = pings.slice(Math.floor(pings.length * 0.1), Math.floor(pings.length * 0.9))
    const avgPing = trimmedPings.reduce((sum, ping) => sum + ping, 0) / trimmedPings.length
    const jitter = Math.sqrt(
      trimmedPings.reduce((sum, ping) => sum + Math.pow(ping - avgPing, 2), 0) / trimmedPings.length,
    )
    const packetLoss = ((totalAttempts - successfulPings) / totalAttempts) * 100

    return { ping: avgPing, jitter, packetLoss }
  }

  private async measureDownloadSpeedAccurate(
    signal: AbortController["signal"],
    onProgress: (progress: number, currentSpeed: number) => void,
  ): Promise<number> {
    const testSizes = [100000, 500000, 1000000, 2000000, 5000000, 10000000]
    const speeds: number[] = []
    let runningAverage = 0

    for (let i = 0; i < testSizes.length; i++) {
      if (signal.aborted) throw new Error("Cancelled")

      try {
        const size = testSizes[i]
        const testUrl = `https://httpbin.org/bytes/${size}`

        const start = performance.now()
        const response = await fetch(testUrl, {
          method: "GET",
          cache: "no-cache",
          signal,
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No response body")

        let totalBytes = 0
        let lastUpdate = start
        let lastBytes = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          totalBytes += value?.length || 0

          // Update live speed every 100ms
          const now = performance.now()
          if (now - lastUpdate > 100) {
            const intervalBytes = totalBytes - lastBytes
            const intervalSeconds = (now - lastUpdate) / 1000
            const instantSpeed = (intervalBytes * 8) / (intervalSeconds * 1000000)

            if (instantSpeed > 0) {
              // Use exponential moving average for smoother updates
              runningAverage = runningAverage === 0 ? instantSpeed : runningAverage * 0.7 + instantSpeed * 0.3

              onProgress((i + totalBytes / size) / testSizes.length, runningAverage)
            }

            lastUpdate = now
            lastBytes = totalBytes
          }
        }

        const end = performance.now()
        const duration = (end - start) / 1000
        const speedMbps = (totalBytes * 8) / (duration * 1000000)

        if (speedMbps > 0 && speedMbps < 10000) {
          speeds.push(speedMbps)
          runningAverage = speeds.reduce((sum, s) => sum + s, 0) / speeds.length
          onProgress((i + 1) / testSizes.length, runningAverage)
        }

        if (speedMbps < 1 && size > 1000000) break
      } catch (error) {
        console.warn(`Download test ${i + 1} failed:`, error)
      }

      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    return speeds.length > 0 ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length : 0
  }

  private async measureUploadSpeedAccurate(
    signal: AbortController["signal"],
    onProgress: (progress: number, currentSpeed: number) => void,
  ): Promise<number> {
    const testSizes = [50000, 100000, 250000, 500000, 1000000, 2000000]
    const speeds: number[] = []
    let runningAverage = 0

    for (let i = 0; i < testSizes.length; i++) {
      if (signal.aborted) throw new Error("Cancelled")

      try {
        const size = testSizes[i]

        // For more accurate upload speed measurement, we'll do multiple samples
        // for each file size to get more data points
        for (let sample = 0; sample < 3; sample++) {
          if (signal.aborted) throw new Error("Cancelled")

          const testData = new Uint8Array(size)
          crypto.getRandomValues(testData)
          const blob = new Blob([testData])

          const start = performance.now()

          // Use XMLHttpRequest for upload progress monitoring
          const uploadSpeed = await new Promise<number>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            let lastLoaded = 0
            let lastTime = start

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const now = performance.now()
                const bytesUploaded = event.loaded - lastLoaded
                const timeElapsed = (now - lastTime) / 1000

                if (timeElapsed > 0.1) {
                  // Update every 100ms
                  const instantSpeed = (bytesUploaded * 8) / (timeElapsed * 1000000)

                  if (instantSpeed > 0) {
                    runningAverage = runningAverage === 0 ? instantSpeed : runningAverage * 0.7 + instantSpeed * 0.3

                    const totalProgress =
                      i / testSizes.length + (sample / 3 + event.loaded / event.total) / testSizes.length

                    onProgress(totalProgress, runningAverage)
                  }

                  lastLoaded = event.loaded
                  lastTime = now
                }
              }
            }

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const end = performance.now()
                const duration = (end - start) / 1000
                const speedMbps = (size * 8) / (duration * 1000000)
                resolve(speedMbps)
              } else {
                reject(new Error(`HTTP ${xhr.status}`))
              }
            }

            xhr.onerror = () => reject(new Error("Network error"))
            xhr.onabort = () => reject(new Error("Aborted"))

            xhr.open("POST", "https://httpbin.org/post")
            xhr.setRequestHeader("Content-Type", "application/octet-stream")
            xhr.send(blob)

            // Add abort handler
            signal.addEventListener("abort", () => xhr.abort())
          })

          if (uploadSpeed > 0 && uploadSpeed < 1000) {
            speeds.push(uploadSpeed)
            runningAverage = speeds.reduce((sum, s) => sum + s, 0) / speeds.length
            onProgress((i + (sample + 1) / 3) / testSizes.length, runningAverage)
          }
        }

        if (runningAverage < 0.5 && size > 500000) break
      } catch (error) {
        console.warn(`Upload test ${i + 1} failed:`, error)
      }

      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    return speeds.length > 0 ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length : 0
  }

  stopTest() {
    this.stopContinuousPing()
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this.isRunning = false
  }
}
