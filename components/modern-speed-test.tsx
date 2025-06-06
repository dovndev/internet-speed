"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  Wifi,
  Settings,
  Globe,
  MapPin,
  TrendingUp,
  BarChart3,
  Gauge,
  Signal,
  Router,
} from "lucide-react"
import { useAccurateSpeedTest } from "@/hooks/use-accurate-speed-test"
import type { SpeedUnit } from "@/lib/speed-test-libraries"

interface DisplayConfig {
  showDownload: boolean
  showUpload: boolean
  showPing: boolean
  showJitter: boolean
  showPacketLoss: boolean
  showLiveGraphs: boolean
  speedUnit: SpeedUnit
}

export default function ModernSpeedTest() {
  const [config, setConfig] = useState<DisplayConfig>({
    showDownload: true,
    showUpload: true,
    showPing: true,
    showJitter: true,
    showPacketLoss: true,
    showLiveGraphs: true,
    speedUnit: "Mbps",
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

  // Modern circular progress meter
  const CircularMeter = ({
    value,
    maxValue,
    color,
    label,
    unit,
    isActive,
    icon: Icon,
  }: {
    value: number
    maxValue: number
    color: string
    label: string
    unit: string
    isActive: boolean
    icon: any
  }) => {
    const percentage = Math.min((value / maxValue) * 100, 100)
    const circumference = 2 * Math.PI * 45
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-300 ${isActive ? "drop-shadow-lg" : ""}`}
            style={{
              filter: isActive ? `drop-shadow(0 0 8px ${color})` : "none",
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`w-5 h-5 mb-1 ${isActive ? "animate-pulse" : ""}`} style={{ color }} />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{value.toFixed(1)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{unit}</div>
        </div>
      </div>
    )
  }

  // Mini graph component
  const MiniGraph = ({ data, color }: { data: Array<{ timestamp: number; value: number }>; color: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas || data.length < 2) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      const maxValue = Math.max(...data.map((d) => d.value), 1)
      const minTime = data[0].timestamp
      const maxTime = data[data.length - 1].timestamp

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((point, index) => {
        const x = ((point.timestamp - minTime) / (maxTime - minTime)) * width
        const y = height - (point.value / maxValue) * height

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Fill area under curve
      ctx.fillStyle = color + "20"
      ctx.beginPath()
      ctx.moveTo(0, height)
      data.forEach((point) => {
        const x = ((point.timestamp - minTime) / (maxTime - minTime)) * width
        const y = height - (point.value / maxValue) * height
        ctx.lineTo(x, y)
      })
      ctx.lineTo(width, height)
      ctx.closePath()
      ctx.fill()
    }, [data, color])

    return <canvas ref={canvasRef} width={200} height={60} className="w-full h-full" />
  }

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
        return "Testing latency..."
      case "download":
        return "Testing download speed..."
      case "upload":
        return "Testing upload speed..."
      case "complete":
        return "Test completed"
      default:
        return "Preparing..."
    }
  }

  const getQualityBadge = (value: number, type: "download" | "upload" | "ping") => {
    if (type === "ping") {
      if (value < 20)
        return { label: "Excellent", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" }
      if (value < 50)
        return { label: "Good", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" }
      if (value < 100)
        return { label: "Fair", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" }
      return { label: "Poor", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" }
    } else {
      if (value > 100)
        return { label: "Excellent", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" }
      if (value > 50)
        return { label: "Good", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" }
      if (value > 25)
        return { label: "Fair", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" }
      return { label: "Poor", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" }
    }
  }

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Internet Speed Test</h1>
          <p className="text-gray-600 dark:text-gray-400">Test your connection speed with precision</p>
        </div>

        {/* Main Test Card */}
        <Card className="mb-8 shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            {/* Status */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div
                  className={`w-3 h-3 rounded-full ${isTestRunning ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
                />
                <span className="text-lg font-medium text-gray-900 dark:text-white">{getPhaseMessage()}</span>
              </div>

              {isTestRunning && (
                <div className="max-w-md mx-auto mb-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{testProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={testProgress} className="h-2" />
                </div>
              )}

              {error && (
                <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center gap-4">
                {!isTestRunning ? (
                  <Button onClick={handleRunTest} size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
                    <Play className="w-5 h-5 mr-2" />
                    Start Test
                  </Button>
                ) : (
                  <Button onClick={stopTest} variant="destructive" size="lg" className="px-8">
                    <Square className="w-5 h-5 mr-2" />
                    Stop Test
                  </Button>
                )}

                <Button onClick={resetTest} variant="outline" size="lg" disabled={isTestRunning}>
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {config.showDownload && (
                <div className="text-center">
                  <CircularMeter
                    value={getCurrentValue("download")}
                    maxValue={1000}
                    color="#10b981"
                    label="Download"
                    unit={config.speedUnit}
                    isActive={testPhase === "download"}
                    icon={Download}
                  />
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Download Speed</h3>
                    <Badge className={getQualityBadge(getCurrentValue("download"), "download").className}>
                      {getQualityBadge(getCurrentValue("download"), "download").label}
                    </Badge>
                  </div>
                </div>
              )}

              {config.showUpload && (
                <div className="text-center">
                  <CircularMeter
                    value={getCurrentValue("upload")}
                    maxValue={1000}
                    color="#3b82f6"
                    label="Upload"
                    unit={config.speedUnit}
                    isActive={testPhase === "upload"}
                    icon={Upload}
                  />
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Speed</h3>
                    <Badge className={getQualityBadge(getCurrentValue("upload"), "upload").className}>
                      {getQualityBadge(getCurrentValue("upload"), "upload").label}
                    </Badge>
                  </div>
                </div>
              )}

              {config.showPing && (
                <div className="text-center">
                  <CircularMeter
                    value={getCurrentValue("ping")}
                    maxValue={200}
                    color="#f59e0b"
                    label="Ping"
                    unit="ms"
                    isActive={testPhase === "ping"}
                    icon={Wifi}
                  />
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Ping Latency</h3>
                    <Badge className={getQualityBadge(getCurrentValue("ping"), "ping").className}>
                      {getQualityBadge(getCurrentValue("ping"), "ping").label}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Live Graphs */}
            {config.showLiveGraphs &&
              (graphData.download.length > 0 || graphData.upload.length > 0 || graphData.ping.length > 0) && (
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Live Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {graphData.download.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Download</span>
                        </div>
                        <div className="h-15">
                          <MiniGraph data={graphData.download} color="#10b981" />
                        </div>
                      </div>
                    )}
                    {graphData.upload.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Upload</span>
                        </div>
                        <div className="h-15">
                          <MiniGraph data={graphData.upload} color="#3b82f6" />
                        </div>
                      </div>
                    )}
                    {graphData.ping.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wifi className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Ping</span>
                        </div>
                        <div className="h-15">
                          <MiniGraph data={graphData.ping} color="#f59e0b" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Tabs for Additional Info */}
        <Tabs defaultValue="details" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Connection Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ISP Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Network Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Router className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{ispInfo.ispName}</div>
                      <div className="text-sm text-gray-500">Internet Service Provider</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{ispInfo.location}</div>
                      <div className="text-sm text-gray-500">Location</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Signal className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{ispInfo.ipAddress}</div>
                      <div className="text-sm text-gray-500">IP Address</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Additional Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config.showJitter && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Jitter</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {(liveData?.currentJitter || finalResults?.jitter || 0).toFixed(1)} ms
                      </span>
                    </div>
                  )}
                  {config.showPacketLoss && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Packet Loss</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {(finalResults?.packetLoss || 0).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Test Duration</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {isTestRunning ? `${((testProgress / 100) * 30).toFixed(0)}s` : finalResults ? "30s" : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Test Server</span>
                    <span className="font-medium text-gray-900 dark:text-white">Auto-selected</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Test Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Display Options</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="download">Download Speed</Label>
                        <Switch
                          id="download"
                          checked={config.showDownload}
                          onCheckedChange={(checked) => setConfig({ ...config, showDownload: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="upload">Upload Speed</Label>
                        <Switch
                          id="upload"
                          checked={config.showUpload}
                          onCheckedChange={(checked) => setConfig({ ...config, showUpload: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ping">Ping Latency</Label>
                        <Switch
                          id="ping"
                          checked={config.showPing}
                          onCheckedChange={(checked) => setConfig({ ...config, showPing: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="jitter">Jitter</Label>
                        <Switch
                          id="jitter"
                          checked={config.showJitter}
                          onCheckedChange={(checked) => setConfig({ ...config, showJitter: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="packetLoss">Packet Loss</Label>
                        <Switch
                          id="packetLoss"
                          checked={config.showPacketLoss}
                          onCheckedChange={(checked) => setConfig({ ...config, showPacketLoss: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="liveGraphs">Live Graphs</Label>
                        <Switch
                          id="liveGraphs"
                          checked={config.showLiveGraphs}
                          onCheckedChange={(checked) => setConfig({ ...config, showLiveGraphs: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Speed Units</h4>
                    <div className="space-y-2">
                      {(["Mbps", "Kbps", "MBps", "KBps"] as SpeedUnit[]).map((unit) => (
                        <div key={unit} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={unit}
                            name="speedUnit"
                            value={unit}
                            checked={config.speedUnit === unit}
                            onChange={(e) => setConfig({ ...config, speedUnit: e.target.value as SpeedUnit })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <Label htmlFor={unit} className="text-sm">
                            {unit} ({unit.includes("b") ? "bits" : "bytes"} per second)
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Final Results Summary */}
        <AnimatePresence>
          {finalResults && testPhase === "complete" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
                    <Gauge className="w-5 h-5" />
                    Test Results Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
                        {finalResults.downloadSpeed.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-500">{config.speedUnit} Download</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                        {finalResults.uploadSpeed.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-500">{config.speedUnit} Upload</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400 mb-1">
                        {finalResults.ping.toFixed(0)}
                      </div>
                      <div className="text-sm text-yellow-600 dark:text-yellow-500">ms Ping</div>
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
