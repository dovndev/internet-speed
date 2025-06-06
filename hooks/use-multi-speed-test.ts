"use client"

import { useState, useCallback, useRef } from "react"
import {
  type BaseSpeedTestService,
  type SpeedTestResult,
  type SpeedTestLibrary,
  createSpeedTestService,
} from "@/lib/speed-test-libraries"

export function useMultiSpeedTest() {
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<Partial<SpeedTestResult>>({})
  const [testProgress, setTestProgress] = useState(0)
  const [testPhase, setTestPhase] = useState<"idle" | "ping" | "download" | "upload" | "complete">("idle")
  const [error, setError] = useState<string | null>(null)
  const [selectedLibrary, setSelectedLibrary] = useState<SpeedTestLibrary>("ng-speed-test") // Changed default to ng-speed-test as it's more reliable

  const speedTestServiceRef = useRef<BaseSpeedTestService | null>(null)

  const getSpeedTestService = (library: SpeedTestLibrary) => {
    // Create a new service if the library changed or if it doesn't exist
    if (!speedTestServiceRef.current || library !== selectedLibrary) {
      speedTestServiceRef.current = createSpeedTestService(library)
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

      const service = getSpeedTestService(library)

      try {
        const onProgress = (progress: any) => {
          setTestPhase(progress.phase)
          setTestProgress(progress.progress)
          setCurrentTest((prev) => ({ ...prev, ...progress.data }))
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
  }
}
