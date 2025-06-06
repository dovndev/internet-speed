"use client"

import { BaseSpeedTestService, type SpeedTestProgress, type SpeedTestResult } from "./speed-test-libraries"

export interface LiveDataPoint {
  timestamp: number
  value: number
}

export interface EnhancedSpeedTestProgress extends SpeedTestProgress {
  liveData?: {
    download?: LiveDataPoint[]
    upload?: LiveDataPoint[]
    ping?: LiveDataPoint[]
  }
}

export class EnhancedSpeedTestService extends BaseSpeedTestService {
  private baseService: BaseSpeedTestService
  private liveData: {
    download: LiveDataPoint[]
    upload: LiveDataPoint[]
    ping: LiveDataPoint[]
  }

  constructor(baseService: BaseSpeedTestService) {
    super()
    this.baseService = baseService
    this.liveData = {
      download: [],
      upload: [],
      ping: [],
    }
  }

  async runTest(onProgress: (progress: EnhancedSpeedTestProgress) => void): Promise<SpeedTestResult> {
    // Reset live data
    this.liveData = {
      download: [],
      upload: [],
      ping: [],
    }

    // Wrap the onProgress callback to capture and enhance with live data
    const enhancedOnProgress = (progress: SpeedTestProgress) => {
      const enhancedProgress: EnhancedSpeedTestProgress = {
        ...progress,
        liveData: { ...this.liveData },
      }

      // Capture data points for the current phase
      if (progress.phase === "ping" && progress.data.ping !== undefined) {
        this.liveData.ping.push({
          timestamp: Date.now(),
          value: progress.data.ping,
        })
      } else if (progress.phase === "download" && progress.data.downloadSpeed !== undefined) {
        this.liveData.download.push({
          timestamp: Date.now(),
          value: progress.data.downloadSpeed,
        })
      } else if (progress.phase === "upload" && progress.data.uploadSpeed !== undefined) {
        this.liveData.upload.push({
          timestamp: Date.now(),
          value: progress.data.uploadSpeed,
        })
      }

      // Call the original onProgress with enhanced data
      onProgress(enhancedProgress)
    }

    // Run the base service test with enhanced progress reporting
    return this.baseService.runTest(enhancedOnProgress)
  }

  stopTest() {
    this.baseService.stopTest()
  }
}

// Enhance the existing speed test service with live data capabilities
export function enhanceSpeedTestService(baseService: BaseSpeedTestService): EnhancedSpeedTestService {
  return new EnhancedSpeedTestService(baseService)
}
