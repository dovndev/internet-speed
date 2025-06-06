"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Square, RotateCcw, AlertCircle } from "lucide-react"
import DarkSpeedometer from "@/components/dark-speedometer"
import LiveMetricsDisplay from "@/components/live-metrics-display"
import IspInfoDisplay from "@/components/isp-info-display"
import TestResultSummary from "@/components/test-result-summary"
import { useEnhancedSpeedTest } from "@/hooks/use-enhanced-speed-test"
import type { SpeedTestLibrary } from "@/lib/speed-test-libraries"

export default function DarkSpeedTest() {
  const [showResults, setShowResults] = useState(false)
  const [ispInfo, setIspInfo] = useState({
    ispName: "Detecting...",
    ipAddress: "Detecting...",
    location: "Detecting...",
    serverInfo: "Automatic",
  })

  const {
    isTestRunning,
    currentTest,
    testProgress,
    testPhase,
    error,
    selectedLibrary,
    runSpeedTest,
    stopTest,
    resetTest,
    liveData,
  } = useEnhancedSpeedTest()

  // Fetch ISP info when component mounts
  useEffect(() => {
    const fetchIspInfo = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/")
        const data = await response.json()

        setIspInfo({
          ispName: data.org || "Unknown ISP",
          ipAddress: data.ip || "Unknown IP",
          location: `${data.city || ""}, ${data.country_name || "Unknown"}`,
          serverInfo: "Automatic",
        })
      } catch (error) {
        console.error("Failed to fetch ISP info:", error)
      }
    }

    fetchIspInfo()
  }, [])

  const handleRunTest = async () => {
    setShowResults(false)

    try {
      await runSpeedTest(selectedLibrary as SpeedTestLibrary)
      setShowResults(true)
    } catch (error) {
      console.error("Test failed:", error)
    }
  }

  const handleReset = () => {
    resetTest()
    setShowResults(false)
  }

  const getPhaseMessage = () => {
    switch (testPhase) {
      case "idle":
        return "Ready to test your connection"
      case "ping":
        return "Measuring connection quality..."
      case "download":
        return "Testing download speed..."
      case "upload":
        return "Testing upload speed..."
      case "complete":
        return "Test completed!"
      default:
        return "Ready to test"
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1123] text-white p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Internet Speed Test
          </h1>
          <p className="text-gray-400">Test your connection speed with real-time metrics</p>
        </div>

        {/* Main Control */}
        <div className="flex items-center justify-center gap-4 my-6">
          {!isTestRunning ? (
            <Button
              onClick={handleRunTest}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full"
            >
              <Play className="w-6 h-6 mr-2" />
              Start Test
            </Button>
          ) : (
            <Button onClick={stopTest} variant="destructive" size="lg" className="px-8 py-6 text-lg rounded-full">
              <Square className="w-6 h-6 mr-2" />
              Stop Test
            </Button>
          )}

          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
            disabled={isTestRunning}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>

        {/* Status and Progress */}
        <div className="text-center">
          <p className="text-gray-300 text-lg mb-2">{getPhaseMessage()}</p>
          {isTestRunning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md mx-auto"
            >
              <Progress value={testProgress} className="h-2 bg-gray-800" />
              <p className="text-gray-400 text-sm mt-1">{testProgress.toFixed(0)}% complete</p>
            </motion.div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 flex items-center gap-2 max-w-md mx-auto">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Metrics Display */}
        <LiveMetricsDisplay
          downloadSpeed={currentTest.downloadSpeed || 0}
          uploadSpeed={currentTest.uploadSpeed || 0}
          ping={currentTest.ping || 0}
          jitter={currentTest.jitter || 0}
          packetLoss={currentTest.packetLoss || 0}
          isActive={isTestRunning}
          testPhase={testPhase}
        />

        {/* Main Speedometer */}
        <div className="flex justify-center my-8">
          <DarkSpeedometer
            value={
              testPhase === "download"
                ? currentTest.downloadSpeed || 0
                : testPhase === "upload"
                  ? currentTest.uploadSpeed || 0
                  : testPhase === "complete"
                    ? currentTest.downloadSpeed || 0
                    : 0
            }
            maxValue={1000}
            unit="Mbps"
            color={
              testPhase === "download"
                ? "download"
                : testPhase === "upload"
                  ? "upload"
                  : testPhase === "ping"
                    ? "ping"
                    : "download"
            }
            isActive={isTestRunning}
            showLabel={false}
          />
        </div>

        {/* ISP Info */}
        <IspInfoDisplay
          ispName={ispInfo.ispName}
          ipAddress={ispInfo.ipAddress}
          location={ispInfo.location}
          serverInfo={ispInfo.serverInfo}
        />

        {/* Results Summary (shown after test completion) */}
        {showResults && testPhase === "complete" && (
          <div className="mt-12">
            <TestResultSummary
              downloadSpeed={currentTest.downloadSpeed || 0}
              uploadSpeed={currentTest.uploadSpeed || 0}
              ping={currentTest.ping || 0}
              jitter={currentTest.jitter || 0}
              packetLoss={currentTest.packetLoss || 0}
              ispName={ispInfo.ispName}
              location={ispInfo.location}
              timestamp={new Date()}
            />
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-800 mt-12 pt-6 text-center text-gray-500 text-sm">
          <p>Results may vary based on network conditions and server location.</p>
        </div>
      </div>
    </div>
  )
}
