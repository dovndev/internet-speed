"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { AccurateSpeedTestService } from "@/lib/accurate-speed-test"

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

export function useAccurateSpeedTest() {
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [testPhase, setTestPhase] = useState<SpeedTestProgress["phase"]>("idle")
  const [currentTest, setCurrentTest] = useState<Partial<SpeedTestResult>>({})
  const [liveData, setLiveData] = useState<SpeedTestProgress["liveData"]>({})
  const [error, setError] = useState<string | null>(null)
  const [finalResults, setFinalResults] = useState<SpeedTestResult | null>(null)

  const speedTestService = useRef(new AccurateSpeedTestService())

  // Force UI updates for live data
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isTestRunning) {
      interval = setInterval(() => {
        // This forces a re-render to ensure live data is displayed
        setLiveData((prev) => ({ ...prev }))
      }, 100)
    }

    return () => {
      if (interval) clearInterval(interval)
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
      const results = await speedTestService.current.runSpeedTest((progress: SpeedTestProgress) => {
        setTestProgress(progress.progress)
        setTestPhase(progress.phase)

        if (progress.data && Object.keys(progress.data).length > 0) {
          setCurrentTest((prev) => ({ ...prev, ...progress.data }))
        }

        if (progress.liveData) {
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
    speedTestService.current.stopTest()
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
    runSpeedTest,
    stopTest,
    resetTest,
  }
}
