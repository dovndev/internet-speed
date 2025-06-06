"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { AccurateSpeedTestService, type SpeedTestLibrary } from "@/lib/accurate-speed-test"

interface SpeedTestResult {
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
}

export function useAccurateSpeedTest() {
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [testPhase, setTestPhase] = useState<"idle" | "ping" | "download" | "upload" | "complete">("idle")
  const [currentTest, setCurrentTest] = useState<Partial<SpeedTestResult>>({})
  const [liveData, setLiveData] = useState<{
    currentDownload?: number
    currentUpload?: number
    currentPing?: number
    currentJitter?: number
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [finalResults, setFinalResults] = useState<SpeedTestResult | null>(null)
  const [library, setLibraryState] = useState<SpeedTestLibrary>("fallback")

  const speedTestServiceRef = useRef<AccurateSpeedTestService>(new AccurateSpeedTestService("fallback"))
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Set the library
  const setLibrary = useCallback((newLibrary: SpeedTestLibrary) => {
    setLibraryState(newLibrary)
    speedTestServiceRef.current.setLibrary(newLibrary)
  }, [])

  // Force UI updates for live data
  useEffect(() => {
    if (isTestRunning) {
      // Create an interval to force UI updates
      updateIntervalRef.current = setInterval(() => {
        // This forces a re-render to ensure live data is displayed
        setLiveData((prev) => ({ ...prev }))
      }, 100)
    } else if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }
  }, [isTestRunning])

  const runSpeedTest = useCallback(async () => {
    setIsTestRunning(true)
    setError(null)
    setTestProgress(0)
    setTestPhase("idle")
    setCurrentTest({})
    setLiveData({})
    setFinalResults(null)

    try {
      const results = await speedTestServiceRef.current.runSpeedTest((progress) => {
        setTestProgress(progress.progress)
        setTestPhase(progress.phase)

        if (progress.data && Object.keys(progress.data).length > 0) {
          setCurrentTest((prev) => ({ ...prev, ...progress.data }))
        }

        if (progress.liveData) {
          // Directly update live data for immediate UI feedback
          setLiveData(progress.liveData)
        }

        if (progress.phase === "complete") {
          setFinalResults(progress.data as SpeedTestResult)
        }
      })

      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      throw err
    } finally {
      setIsTestRunning(false)
    }
  }, [])

  const stopTest = useCallback(() => {
    speedTestServiceRef.current.stopTest()
    setIsTestRunning(false)
    setTestPhase("idle")
  }, [])

  const resetTest = useCallback(() => {
    setTestProgress(0)
    setTestPhase("idle")
    setCurrentTest({})
    setLiveData({})
    setError(null)
    setFinalResults(null)
  }, [])

  return {
    isTestRunning,
    testProgress,
    testPhase,
    currentTest,
    liveData,
    error,
    finalResults,
    library,
    runSpeedTest,
    stopTest,
    resetTest,
    setLibrary,
  }
}
