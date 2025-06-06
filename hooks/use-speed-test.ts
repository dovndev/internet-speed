"use client"

import { useState, useCallback } from "react"
import { SpeedTestService } from "@/lib/speed-test"

interface SpeedTestResult {
  id: string
  timestamp: Date
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
}

export function useSpeedTest() {
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<Partial<SpeedTestResult>>({})
  const [testProgress, setTestProgress] = useState(0)
  const [testPhase, setTestPhase] = useState<"idle" | "ping" | "download" | "upload" | "complete">("idle")
  const [error, setError] = useState<string | null>(null)

  const speedTestService = new SpeedTestService()

  const runSpeedTest = useCallback(async () => {
    setIsTestRunning(true)
    setTestProgress(0)
    setCurrentTest({})
    setError(null)

    try {
      const result = await speedTestService.runSpeedTest((phase, progress, data) => {
        setTestPhase(phase as any)
        setTestProgress(progress)
        setCurrentTest((prev) => ({ ...prev, ...data }))
      })

      setTestPhase("complete")
      setTestProgress(100)

      const finalResult: SpeedTestResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        ...result,
      }

      setCurrentTest(finalResult)
      return finalResult
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speed test failed")
      throw err
    } finally {
      setIsTestRunning(false)
    }
  }, [])

  const stopTest = useCallback(() => {
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
