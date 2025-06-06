"use client"

import { useState, useCallback, useRef } from "react"
import {
  type BaseSpeedTestService,
  type SpeedTestResult,
  type SpeedTestLibrary,
  createSpeedTestService,
} from "@/lib/speed-test-libraries"
import { enhanceSpeedTestService, type LiveDataPoint, type EnhancedSpeedTestProgress } from "@/lib/enhanced-speed-test"

export function useEnhancedSpeedTest() {
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<Partial<SpeedTestResult>>({})
  const [testProgress, setTestProgress] = useState(0)
  const [testPhase, setTestPhase] = useState<"idle" | "ping" | "download" | "upload" | "complete">("idle")
  const [error, setError] = useState<string | null>(null)
  const [selectedLibrary, setSelectedLibrary] = useState<SpeedTestLibrary>("ng-speed-test")

  // Live data state
  const [liveDownloadData, setLiveDownloadData] = useState<LiveDataPoint[]>([])
  const [liveUploadData, setLiveUploadData] = useState<LiveDataPoint[]>([])
  const [livePingData, setLivePingData] = useState<LiveDataPoint[]>([])

  const speedTestServiceRef = useRef<BaseSpeedTestService | null>(null)

  const getSpeedTestService = (library: SpeedTestLibrary) => {
    // Create a new service if the library changed or if it doesn't exist
    if (!speedTestServiceRef.current || library !== selectedLibrary) {
      const baseService = createSpeedTestService(library)
      speedTestServiceRef.current = enhanceSpeedTestService(baseService)
    }
    return speedTestServiceRef.current
  }

  const runSpeedTest = useCallback(
    async (library: SpeedTestLibrary = selectedLibrary) => {
      setIsTestRunning(true)
      setTestProgress(0)
      setCurrentTest({})
      setError(null)
      setSelectedLibrary(library)
      setTestPhase("ping")

      // Reset live data
      setLiveDownloadData([])
      setLiveUploadData([])
      setLivePingData([])

      const service = getSpeedTestService(library)

      try {
        const onProgress = (progress: EnhancedSpeedTestProgress) => {
          setTestPhase(progress.phase)
          setTestProgress(progress.progress)
          setCurrentTest((prev) => ({ ...prev, ...progress.data }))

          // Update live data if available
          if (progress.liveData) {
            if (progress.liveData.download) {
              setLiveDownloadData(progress.liveData.download)
            }
            if (progress.liveData.upload) {
              setLiveUploadData(progress.liveData.upload)
            }
            if (progress.liveData.ping) {
              setLivePingData(progress.liveData.ping)
            }
          }
        }

        const result = await service.runTest(onProgress)

        const finalResult: SpeedTestResult & { id: string; timestamp: Date } = {
          id: Date.now().toString(),
          timestamp: new Date(),
          ...result,
        }

        setCurrentTest(finalResult)
        setTestPhase("complete")
        setTestProgress(100)

        return finalResult
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Speed test failed"
        setError(errorMessage)
        console.error("Speed test error:", err)

        // Try fallback if primary library fails
        if (library !== "fallback") {
          console.log("Trying fallback method...")
          try {
            return await runSpeedTest("fallback")
          } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError)
            throw new Error("All speed test methods failed")
          }
        } else {
          throw new Error(errorMessage)
        }
      } finally {
        setIsTestRunning(false)
      }
    },
    [selectedLibrary],
  )

  const stopTest = useCallback(() => {
    const service = speedTestServiceRef.current
    if (service) {
      service.stopTest()
    }
    setIsTestRunning(false)
    setTestPhase("idle")
    setTestProgress(0)
  }, [])

  const resetTest = useCallback(() => {
    setCurrentTest({})
    setTestProgress(0)
    setTestPhase("idle")
    setError(null)
    setLiveDownloadData([])
    setLiveUploadData([])
    setLivePingData([])
  }, [])

  return {
    isTestRunning,
    currentTest,
    testProgress,
    testPhase,
    error,
    selectedLibrary,
    setSelectedLibrary,
    runSpeedTest,
    stopTest,
    resetTest,
    liveData: {
      download: liveDownloadData,
      upload: liveUploadData,
      ping: livePingData,
    },
  }
}
