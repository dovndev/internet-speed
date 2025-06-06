"use client"

import { useState, useCallback, useRef } from "react"
import { RealSpeedTestService } from "@/lib/real-speed-test"

interface SpeedTestResult {
  id: string
  timestamp: Date
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
}

export function useRealSpeedTest() {
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<Partial<SpeedTestResult>>({})
  const [testProgress, setTestProgress] = useState(0)
  const [testPhase, setTestPhase] = useState<"idle" | "ping" | "download" | "upload" | "complete">("idle")
  const [error, setError] = useState<string | null>(null)
  const [testMethod, setTestMethod] = useState<"cloudflare" | "network-speed" | "fast">("cloudflare")

  const speedTestServiceRef = useRef<RealSpeedTestService | null>(null)

  const getSpeedTestService = () => {
    if (!speedTestServiceRef.current) {
      speedTestServiceRef.current = new RealSpeedTestService()
    }
    return speedTestServiceRef.current
  }

  const runSpeedTest = useCallback(async (method: "cloudflare" | "network-speed" | "fast" = "cloudflare") => {
    setIsTestRunning(true)
    setTestProgress(0)
    setCurrentTest({})
    setError(null)
    setTestMethod(method)
    setTestPhase("ping")

    const service = getSpeedTestService()

    try {
      const onProgress = (progress: any) => {
        setTestPhase(progress.phase)
        setTestProgress(progress.progress)
        setCurrentTest((prev) => ({ ...prev, ...progress.data }))
      }

      let result: any

      switch (method) {
        case "cloudflare":
          try {
            result = await service.runCloudflareSpeedTest(onProgress)
          } catch (cloudflareError) {
            console.warn("Cloudflare test failed, falling back to simple speed test:", cloudflareError)
            result = await service.runSimpleSpeedTest(onProgress)
          }
          break

        case "network-speed":
          try {
            result = await service.runNetworkSpeedTest(onProgress)
          } catch (networkError) {
            console.warn("Network-speed test failed, falling back to simple speed test:", networkError)
            result = await service.runSimpleSpeedTest(onProgress)
          }
          break

        case "fast":
          try {
            result = await service.runFastSpeedTest(onProgress)
          } catch (fastError) {
            console.warn("Fast.com test failed, falling back to simple speed test:", fastError)
            result = await service.runSimpleSpeedTest(onProgress)
          }
          break

        default:
          result = await service.runSimpleSpeedTest(onProgress)
      }

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

      // Final fallback to simple speed test
      try {
        console.log("Trying final fallback to simple speed test...")
        const onProgress = (progress: any) => {
          setTestPhase(progress.phase)
          setTestProgress(progress.progress)
          setCurrentTest((prev) => ({ ...prev, ...progress.data }))
        }

        const result = await service.runSimpleSpeedTest(onProgress)
        const finalResult: SpeedTestResult = {
          id: Date.now().toString(),
          timestamp: new Date(),
          ...result,
        }

        setCurrentTest(finalResult)
        setTestPhase("complete")
        setTestProgress(100)
        setError(null) // Clear error since fallback worked

        return finalResult
      } catch (fallbackError) {
        console.error("All speed test methods failed:", fallbackError)
        throw new Error("All speed test methods failed. Please check your internet connection.")
      }
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
    testMethod,
    runSpeedTest,
    stopTest,
    resetTest,
  }
}
