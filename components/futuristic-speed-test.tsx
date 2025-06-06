"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Square, RotateCcw, Zap, Wifi, Download, Upload, Globe } from "lucide-react"
import FuturisticSpeedometer from "@/components/futuristic-speedometer"
import HolographicDisplay from "@/components/holographic-display"
import NeuralNetworkBackground from "@/components/neural-network-bg"
import { useAccurateSpeedTest } from "@/hooks/use-accurate-speed-test"

export default function FuturisticSpeedTest() {
  const [showResults, setShowResults] = useState(false)
  const [ispInfo, setIspInfo] = useState({
    ispName: "Detecting...",
    ipAddress: "Detecting...",
    location: "Detecting...",
  })

  const { isTestRunning, currentTest, testProgress, testPhase, error, runSpeedTest, stopTest, resetTest } =
    useAccurateSpeedTest()

  // Fetch ISP info
  useEffect(() => {
    const fetchIspInfo = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/")
        const data = await response.json()

        setIspInfo({
          ispName: data.org || "Unknown ISP",
          ipAddress: data.ip || "Unknown IP",
          location: `${data.city || ""}, ${data.country_name || "Unknown"}`,
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
      await runSpeedTest()
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
        return "Neural networks ready for speed analysis"
      case "ping":
        return "Analyzing connection pathways..."
      case "download":
        return "Measuring data reception velocity..."
      case "upload":
        return "Testing data transmission capacity..."
      case "complete":
        return "Analysis complete - Results compiled"
      default:
        return "System ready"
    }
  }

  const getActiveSpeedometer = () => {
    switch (testPhase) {
      case "download":
        return currentTest.downloadSpeed || 0
      case "upload":
        return currentTest.uploadSpeed || 0
      case "complete":
        return currentTest.downloadSpeed || 0
      default:
        return 0
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden matrix-bg">
      <NeuralNetworkBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
            <h1
              className="text-6xl font-bold tracking-wider font-display holographic-text"
              style={{
                background: "linear-gradient(45deg, #00f5ff, #a855f7, #f59e0b)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                fontFamily: "'Arial Black', sans-serif",
                textShadow: "0 0 30px rgba(0, 245, 255, 0.5)",
              }}
            >
              NEURAL SPEED TEST
            </h1>
            <p className="text-cyan-300 text-xl tracking-widest font-futuristic neon-glow">
              QUANTUM NETWORK ANALYSIS SYSTEM
            </p>
          </motion.div>

          {/* Status Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-4"
          >
            <div className="text-cyan-400 text-lg font-medium tracking-wide font-futuristic">{getPhaseMessage()}</div>

            {isTestRunning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto"
              >
                <Progress
                  value={testProgress}
                  className="h-3 bg-slate-800 border border-cyan-500/30 neon-border"
                  style={{
                    background: "rgba(15, 23, 42, 0.8)",
                  }}
                />
                <div className="text-cyan-300 text-sm mt-2 font-futuristic">
                  PROGRESS: {testProgress.toFixed(1)}% COMPLETE
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 font-futuristic"
              >
                SYSTEM ERROR: {error}
              </motion.div>
            )}
          </motion.div>

          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-6"
          >
            {!isTestRunning ? (
              <Button
                onClick={handleRunTest}
                size="lg"
                className="px-12 py-6 text-xl font-bold tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 rounded-xl shadow-lg font-futuristic pulse-glow"
                style={{
                  boxShadow: "0 0 30px rgba(0, 245, 255, 0.5)",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                <Zap className="w-6 h-6 mr-3" />
                INITIATE SCAN
              </Button>
            ) : (
              <Button
                onClick={stopTest}
                size="lg"
                className="px-12 py-6 text-xl font-bold tracking-wider bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white border-0 rounded-xl font-futuristic"
                style={{
                  boxShadow: "0 0 30px rgba(239, 68, 68, 0.5)",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                <Square className="w-6 h-6 mr-3" />
                ABORT SCAN
              </Button>
            )}

            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg font-bold tracking-wider bg-transparent border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 rounded-xl font-futuristic"
              disabled={isTestRunning}
              style={{
                fontFamily: "'Courier New', monospace",
              }}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              RESET
            </Button>
          </motion.div>

          {/* Main Display Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            {/* Live Metrics */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <HolographicDisplay
                title="DOWNLOAD VELOCITY"
                value={(currentTest.downloadSpeed || 0).toFixed(2)}
                unit="Mbps"
                isActive={testPhase === "download"}
                color="cyan"
                size="md"
              />

              <HolographicDisplay
                title="UPLOAD CAPACITY"
                value={(currentTest.uploadSpeed || 0).toFixed(2)}
                unit="Mbps"
                isActive={testPhase === "upload"}
                color="purple"
                size="md"
              />
            </motion.div>

            {/* Central Speedometer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center"
            >
              <FuturisticSpeedometer
                value={getActiveSpeedometer()}
                maxValue={1000}
                label="NETWORK VELOCITY"
                color="primary"
                isActive={isTestRunning}
                unit="Mbps"
              />
            </motion.div>

            {/* Connection Quality */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              <HolographicDisplay
                title="LATENCY"
                value={(currentTest.ping || 0).toFixed(0)}
                unit="ms"
                subtitle={`Jitter: ${(currentTest.jitter || 0).toFixed(1)}ms`}
                isActive={testPhase === "ping"}
                color="amber"
                size="md"
              />

              <HolographicDisplay
                title="PACKET INTEGRITY"
                value={(100 - (currentTest.packetLoss || 0)).toFixed(1)}
                unit="%"
                subtitle={`Loss: ${(currentTest.packetLoss || 0).toFixed(1)}%`}
                isActive={testPhase === "ping"}
                color="emerald"
                size="md"
              />
            </motion.div>
          </div>

          {/* ISP Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12"
          >
            <div className="flex items-center gap-4 p-6 bg-slate-900/50 border border-cyan-500/30 rounded-lg backdrop-blur-sm neon-border">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Globe className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-cyan-300 font-bold text-lg tracking-wide font-futuristic">{ispInfo.ispName}</div>
                <div className="text-cyan-500 text-sm font-futuristic">{ispInfo.ipAddress}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-slate-900/50 border border-purple-500/30 rounded-lg backdrop-blur-sm neon-border">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-purple-300 font-bold text-lg tracking-wide font-futuristic">
                  {ispInfo.location}
                </div>
                <div className="text-purple-500 text-sm font-futuristic">Network Location</div>
              </div>
            </div>
          </motion.div>

          {/* Results Summary */}
          <AnimatePresence>
            {showResults && testPhase === "complete" && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="mt-12 p-8 bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-cyan-500/50 rounded-2xl backdrop-blur-sm neon-border"
                style={{
                  boxShadow: "0 0 50px rgba(0, 245, 255, 0.2)",
                }}
              >
                <h2 className="text-3xl font-bold text-center mb-8 text-cyan-400 tracking-wider font-futuristic neon-glow">
                  ANALYSIS COMPLETE
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <Download className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-cyan-400 mb-2 font-display">
                      {(currentTest.downloadSpeed || 0).toFixed(2)} Mbps
                    </div>
                    <div className="text-cyan-300 text-sm tracking-wide font-futuristic">DOWNLOAD SPEED</div>
                  </div>

                  <div className="text-center p-6 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <Upload className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-purple-400 mb-2 font-display">
                      {(currentTest.uploadSpeed || 0).toFixed(2)} Mbps
                    </div>
                    <div className="text-purple-300 text-sm tracking-wide font-futuristic">UPLOAD SPEED</div>
                  </div>

                  <div className="text-center p-6 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <Wifi className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-amber-400 mb-2 font-display">
                      {(currentTest.ping || 0).toFixed(0)} ms
                    </div>
                    <div className="text-amber-300 text-sm tracking-wide font-futuristic">LATENCY</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
