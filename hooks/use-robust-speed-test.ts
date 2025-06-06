"use client"

import { useState, useCallback, useRef } from "react"
import { RobustSpeedTestService } from "@/lib/robust-speed-test"

interface SpeedTestResult {
  id: string
  timestamp: Date
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
}

export function useRobustSpeedTest() {
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<Partial<SpeedTestResult>>({})
  const [testProgress, setTestProgress] = useState(0)
  const [testPhase, setTestPhase] = useState<"idle" | "ping" | "download" | "upload" | "complete">("idle")
  const [error, setError] = useState<string | null>(null)

  const speedTestServiceRef = useRef<RobustSpeedTestService | null>(null)

  const getSpeedTestService = () => {
    if (!speedTestServiceRef.current) {
      speedTestServiceRef.current = new RobustSpeedTestService()
    }
    return speedTestServiceRef.current
  }

  const runSpeedTest = useCallback(async () => {
    setIsTestRunning(true)
    setTestProgress(0)
    setCurrentTest({})
    setError(null)
    setTestPhase("ping")

    const service = getSpeedTestService()

    try {
      const onProgress = (progress: any) => {
        setTestPhase(progress.phase)
        setTestProgress(progress.progress)
        setCurrentTest((prev) => ({ ...prev, ...progress.data }))
      }

      const result = await service.runSpeedTest(onProgress)

      const finalResult: SpeedTestResult = {
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
      throw new Error(errorMessage)
    } finally {
      setIsTestRunning(false)
    }
  }, [])

  const stopTest = useCallback(() => {
    const service = getSpeedTestService()
    service.stopTest()
    setIsTestRunning(false)
    setTestPhase("idle")
    setTestProgress(0)
  }, [])

  const resetTest = useCallback(() => {
    setCurrentTest({})
    setTestProgress(0)
    setTestPhase("idle")
    setError(null)
  }, [])

  return {
    isTestRunning,
    currentTest,
    testProgress,
    testPhase,
    error,
    runSpeedTest,
    stopTest,
    resetTest,
  }
}
