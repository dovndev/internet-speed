"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  Wifi,
  Settings,
  ChevronDown,
  Activity,
  Gauge,
  BarChart3,
  Sliders,
  Globe,
  Zap,
} from "lucide-react"
import ConfigPanel from "@/components/config-panel"
import LiveSpeedGraph from "@/components/live-speed-graph"
import { useAccurateSpeedTest } from "@/hooks/use-accurate-speed-test"
import type { SpeedUnit } from "@/lib/speed-test-libraries"

interface DisplayConfig {
  showDownload: boolean
  showUpload: boolean
  showPing: boolean
  showJitter: boolean
  showPacketLoss: boolean
  displayFormat: "gauge" | "progress" | "numeric" | "card"
  meterTheme: "default" | "neon" | "minimal" | "gauge"
  meterSize: "sm" | "md" | "lg"
  showLiveGraphs: boolean
}

export default function FuturisticCleanTest() {
  const [showConfig, setShowConfig] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>("Mbps")
  const [config, setConfig] = useState<DisplayConfig>({
    showDownload: true,
    showUpload: true,
    showPing: true,
    showJitter: true,
    showPacketLoss: true,
    displayFormat: "gauge",
    meterTheme: "neon",
    meterSize: "md",
    showLiveGraphs: true,
  })

  const [ispInfo, setIspInfo] = useState({
    ispName: "Detecting...",
    ipAddress: "Detecting...",
    location: "Detecting...",
  })

  const [graphData, setGraphData] = useState<{
    download: Array<{ timestamp: number; value: number }>
    upload: Array<{ timestamp: number; value: number }>
    ping: Array<{ timestamp: number; value: number }>
  }>({
    download: [],
    upload: [],
    ping: [],
  })

  // Refs for canvas elements
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null)
  const uploadCanvasRef = useRef<HTMLCanvasElement>(null)
  const pingCanvasRef = useRef<HTMLCanvasElement>(null)

  const {
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
  } = useAccurateSpeedTest()

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

  // Update graph data with live measurements
  useEffect(() => {
    if (liveData) {
      const timestamp = Date.now()

      setGraphData((prev) => ({
        download:
          liveData.currentDownload !== undefined
            ? [...prev.download.slice(-29), { timestamp, value: liveData.currentDownload }]
            : prev.download,
        upload:
          liveData.currentUpload !== undefined
            ? [...prev.upload.slice(-29), { timestamp, value: liveData.currentUpload }]
            : prev.upload,
        ping:
          liveData.currentPing !== undefined
            ? [...prev.ping.slice(-29), { timestamp, value: liveData.currentPing }]
            : prev.ping,
      }))
    }
  }, [liveData])

  // Clear graph data when test resets
  useEffect(() => {
    if (!isTestRunning && testPhase === "idle") {
      setGraphData({ download: [], upload: [], ping: [] })
    }
  }, [isTestRunning, testPhase])

  // Draw speedometer on canvas
  useEffect(() => {
    const drawSpeedometer = (
      canvasRef: React.RefObject<HTMLCanvasElement>,
      value: number,
      maxValue: number,
      color: string,
      isActive: boolean,
    ) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(centerX, centerY) * 0.8

      // Draw background arc
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false)
      ctx.lineWidth = 10
      ctx.strokeStyle = "rgba(200, 200, 200, 0.2)"
      ctx.stroke()

      // Calculate angle based on value
      const normalizedValue = Math.min(value, maxValue) / maxValue
      const angle = Math.PI + normalizedValue * Math.PI

      // Draw value arc
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, Math.PI, angle, false)
      ctx.lineWidth = 10
      ctx.strokeStyle = color
      if (isActive) {
        ctx.shadowBlur = 15
        ctx.shadowColor = color
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Draw needle
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -radius * 0.9)
      ctx.lineWidth = 2
      ctx.strokeStyle = isActive ? color : "#888"
      if (isActive) {
        ctx.shadowBlur = 10
        ctx.shadowColor = color
      }
      ctx.stroke()
      ctx.restore()

      // Draw center circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI, false)
      ctx.fillStyle = isActive ? color : "#888"
      if (isActive) {
        ctx.shadowBlur = 10
        ctx.shadowColor = color
      }
      ctx.fill()
      ctx.shadowBlur = 0

      // Draw text
      ctx.font = "bold 24px Arial"
      ctx.fillStyle = "#fff"
      ctx.textAlign = "center"
      ctx.fillText(value.toFixed(1), centerX, centerY + radius * 0.5)
    }

    // Draw all speedometers
    if (downloadCanvasRef.current) {
      drawSpeedometer(downloadCanvasRef, getCurrentValue("download"), 1000, "#10b981", testPhase === "download")
    }

    if (uploadCanvasRef.current) {
      drawSpeedometer(uploadCanvasRef, getCurrentValue("upload"), 1000, "#3b82f6", testPhase === "upload")
    }

    if (pingCanvasRef.current) {
      drawSpeedometer(pingCanvasRef, getCurrentValue("ping"), 200, "#eab308", testPhase === "ping")
    }

    // Update every 100ms during test
    const interval = setInterval(() => {
      if (isTestRunning) {
        if (downloadCanvasRef.current) {
          drawSpeedometer(downloadCanvasRef, getCurrentValue("download"), 1000, "#10b981", testPhase === "download")
        }
        if (uploadCanvasRef.current) {
          drawSpeedometer(uploadCanvasRef, getCurrentValue("upload"), 1000, "#3b82f6", testPhase === "upload")
        }
        if (pingCanvasRef.current) {
          drawSpeedometer(pingCanvasRef, getCurrentValue("ping"), 200, "#eab308", testPhase === "ping")
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isTestRunning, testPhase, liveData, finalResults])

  const handleRunTest = async () => {
    try {
      await runSpeedTest()
    } catch (error) {
      console.error("Test failed:", error)
    }
  }

  const getPhaseMessage = () => {
    switch (testPhase) {
      case "idle":
        return "Ready to test your connection"
      case "ping":
        return "Testing connection latency..."
      case "download":
        return "Measuring download speed..."
      case "upload":
        return "Measuring upload speed..."
      case "complete":
        return "Test completed successfully"
      default:
        return "Preparing test..."
    }
  }

  const getQualityBadge = (value: number, type: "download" | "upload" | "ping") => {
    if (type === "ping") {
      if (value < 20) return { label: "Excellent", variant: "default" as const }
      if (value < 50) return { label: "Good", variant: "secondary" as const }
      if (value < 100) return { label: "Fair", variant: "outline" as const }
      return { label: "Poor", variant: "destructive" as const }
    } else {
      if (value > 100) return { label: "Excellent", variant: "default" as const }
      if (value > 50) return { label: "Good", variant: "secondary" as const }
      if (value > 25) return { label: "Fair", variant: "outline" as const }
      return { label: "Poor", variant: "destructive" as const }
    }
  }

  // Get current live values or final results
  const getCurrentValue = (type: "download" | "upload" | "ping") => {
    if (liveData) {
      switch (type) {
        case "download":
          return liveData.currentDownload || 0
        case "upload":
          return liveData.currentUpload || 0
        case "ping":
          return liveData.currentPing || 0
      }
    }

    if (finalResults) {
      switch (type) {
        case "download":
          return finalResults.downloadSpeed
        case "upload":
          return finalResults.uploadSpeed
        case "ping":
          return finalResults.ping
      }
    }

    return 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">
            Advanced Speed Test
          </h1>
          <p className="text-slate-400">High-precision network performance analysis</p>
        </div>

        {/* Status and Controls */}
        <Card className="mb-8 bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span className="text-lg font-medium">{getPhaseMessage()}</span>
              </div>

              {isTestRunning && (
                <div className="max-w-md mx-auto">
                  <Progress value={testProgress} className="h-2 bg-slate-700">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                  </Progress>
                  <div className="text-sm text-slate-400 mt-2">{testProgress.toFixed(1)}% Complete</div>
                </div>
              )}

              {error && (
                <div className="max-w-md mx-auto p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-center gap-4">
                {!isTestRunning ? (
                  <Button
                    onClick={handleRunTest}
                    size="lg"
                    className="px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Test
                  </Button>
                ) : (
                  <Button onClick={stopTest} variant="destructive" size="lg" className="px-8">
                    <Square className="w-5 h-5 mr-2" />
                    Stop Test
                  </Button>
                )}

                <Button
                  onClick={resetTest}
                  variant="outline"
                  size="lg"
                  disabled={isTestRunning}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>

                <Collapsible open={showConfig} onOpenChange={setShowConfig}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Settings className="w-5 h-5 mr-2" />
                      Settings
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        <Collapsible open={showConfig} onOpenChange={setShowConfig}>
          <CollapsibleContent>
            <Card className="mb-8 bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <ConfigPanel
                  config={config}
                  onConfigChange={setConfig}
                  speedUnit={speedUnit}
                  onSpeedUnitChange={setSpeedUnit}
                />
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-700">
              <Gauge className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="graphs" className="data-[state=active]:bg-slate-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Live Graphs
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-slate-700">
              <Sliders className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {config.showDownload && (
                <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-green-400" />
                        <span className="font-medium">Download</span>
                      </div>
                      <Badge {...getQualityBadge(getCurrentValue("download"), "download")}>
                        {getQualityBadge(getCurrentValue("download"), "download").label}
                      </Badge>
                    </div>

                    <div className="flex justify-center mb-4">
                      <canvas ref={downloadCanvasRef} width={200} height={200} className="w-full max-w-[200px]" />
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">{getCurrentValue("download").toFixed(2)}</div>
                      <div className="text-sm text-slate-400">{speedUnit}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {config.showUpload && (
                <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-400" />
                        <span className="font-medium">Upload</span>
                      </div>
                      <Badge {...getQualityBadge(getCurrentValue("upload"), "upload")}>
                        {getQualityBadge(getCurrentValue("upload"), "upload").label}
                      </Badge>
                    </div>

                    <div className="flex justify-center mb-4">
                      <canvas ref={uploadCanvasRef} width={200} height={200} className="w-full max-w-[200px]" />
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">{getCurrentValue("upload").toFixed(2)}</div>
                      <div className="text-sm text-slate-400">{speedUnit}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {config.showPing && (
                <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-5 h-5 text-yellow-400" />
                        <span className="font-medium">Ping</span>
                      </div>
                      <Badge {...getQualityBadge(getCurrentValue("ping"), "ping")}>
                        {getQualityBadge(getCurrentValue("ping"), "ping").label}
                      </Badge>
                    </div>

                    <div className="flex justify-center mb-4">
                      <canvas ref={pingCanvasRef} width={200} height={200} className="w-full max-w-[200px]" />
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">{getCurrentValue("ping").toFixed(0)}</div>
                      <div className="text-sm text-slate-400">ms</div>

                      {config.showJitter && (
                        <div className="text-sm mt-2">
                          <span className="text-slate-400">Jitter: </span>
                          <span className="font-medium">
                            {(liveData?.currentJitter || finalResults?.jitter || 0).toFixed(1)} ms
                          </span>
                        </div>
                      )}

                      {config.showPacketLoss && (
                        <div className="text-sm">
                          <span className="text-slate-400">Packet Loss: </span>
                          <span className="font-medium">{(finalResults?.packetLoss || 0).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Graphs Tab */}
          <TabsContent value="graphs" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <LiveSpeedGraph
                type="download"
                data={graphData.download}
                currentValue={getCurrentValue("download")}
                maxValue={1000}
                unit={speedUnit}
                height={200}
              />
              <LiveSpeedGraph
                type="upload"
                data={graphData.upload}
                currentValue={getCurrentValue("upload")}
                maxValue={1000}
                unit={speedUnit}
                height={200}
              />
              <LiveSpeedGraph
                type="ping"
                data={graphData.ping}
                currentValue={getCurrentValue("ping")}
                maxValue={200}
                unit="ms"
                height={200}
              />
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{ispInfo.ispName}</div>
                      <div className="text-sm text-slate-400">{ispInfo.ipAddress}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-900/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{ispInfo.location}</div>
                      <div className="text-sm text-slate-400">Network Location</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Final Results Summary */}
        <AnimatePresence>
          {finalResults && testPhase === "complete" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="border-cyan-800 bg-cyan-900/10">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-2 mb-4">
                    <Gauge className="w-5 h-5" />
                    Test Results Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {finalResults.downloadSpeed.toFixed(2)} {speedUnit}
                      </div>
                      <div className="text-sm text-slate-400">Download Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {finalResults.uploadSpeed.toFixed(2)} {speedUnit}
                      </div>
                      <div className="text-sm text-slate-400">Upload Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">{finalResults.ping.toFixed(0)} ms</div>
                      <div className="text-sm text-slate-400">Ping Latency</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
