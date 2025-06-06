"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  Wifi,
  Globe,
  Settings,
  ChevronDown,
  Activity,
  Gauge,
} from "lucide-react"
import ConfigPanel from "@/components/config-panel"
import LiveSpeedGraph from "@/components/live-speed-graph"
import RotatingSpeedMeter from "@/components/rotating-speed-meter"
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

export default function CleanSpeedTest() {
  const [showConfig, setShowConfig] = useState(false)
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>("Mbps")
  const [config, setConfig] = useState<DisplayConfig>({
    showDownload: true,
    showUpload: true,
    showPing: true,
    showJitter: true,
    showPacketLoss: true,
    displayFormat: "gauge",
    meterTheme: "default",
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
    if (liveData && isTestRunning) {
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
  }, [liveData, isTestRunning])

  // Clear graph data when test resets
  useEffect(() => {
    if (!isTestRunning && testPhase === "idle") {
      setGraphData({ download: [], upload: [], ping: [] })
    }
  }, [isTestRunning, testPhase])

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
    if (isTestRunning && liveData) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Internet Speed Test</h1>
          <p className="text-slate-600 dark:text-slate-400">Test your connection speed with real-time monitoring</p>
        </div>

        {/* Status and Controls */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span className="text-lg font-medium">{getPhaseMessage()}</span>
              </div>

              {isTestRunning && (
                <div className="max-w-md mx-auto">
                  <Progress value={testProgress} className="h-2" />
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    {testProgress.toFixed(1)}% Complete
                  </div>
                </div>
              )}

              {error && (
                <div className="max-w-md mx-auto p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-center gap-4">
                {!isTestRunning ? (
                  <Button onClick={handleRunTest} size="lg" className="px-8">
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

                <Collapsible open={showConfig} onOpenChange={setShowConfig}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="lg">
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
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
              </CardHeader>
              <CardContent>
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

        {/* Main Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {config.showDownload && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-green-500" />
                    Download
                  </div>
                  <Badge {...getQualityBadge(getCurrentValue("download"), "download")}>
                    {getQualityBadge(getCurrentValue("download"), "download").label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-4">
                  <RotatingSpeedMeter
                    value={getCurrentValue("download")}
                    maxValue={1000}
                    unit={speedUnit}
                    size={config.meterSize}
                    theme={config.meterTheme}
                    isActive={testPhase === "download"}
                  />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {getCurrentValue("download").toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{speedUnit}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {config.showUpload && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-500" />
                    Upload
                  </div>
                  <Badge {...getQualityBadge(getCurrentValue("upload"), "upload")}>
                    {getQualityBadge(getCurrentValue("upload"), "upload").label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-4">
                  <RotatingSpeedMeter
                    value={getCurrentValue("upload")}
                    maxValue={1000}
                    unit={speedUnit}
                    size={config.meterSize}
                    theme={config.meterTheme}
                    isActive={testPhase === "upload"}
                  />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {getCurrentValue("upload").toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{speedUnit}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {config.showPing && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-yellow-500" />
                    Ping
                  </div>
                  <Badge {...getQualityBadge(getCurrentValue("ping"), "ping")}>
                    {getQualityBadge(getCurrentValue("ping"), "ping").label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                    {getCurrentValue("ping").toFixed(0)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">ms</div>

                  {config.showJitter && (
                    <div className="text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Jitter: </span>
                      <span className="font-medium">
                        {(liveData?.currentJitter || finalResults?.jitter || 0).toFixed(1)} ms
                      </span>
                    </div>
                  )}

                  {config.showPacketLoss && (
                    <div className="text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Packet Loss: </span>
                      <span className="font-medium">{(finalResults?.packetLoss || 0).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live Graphs */}
        {config.showLiveGraphs && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
        )}

        {/* ISP Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{ispInfo.ispName}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{ispInfo.ipAddress}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{ispInfo.location}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Network Location</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final Results Summary */}
        <AnimatePresence>
          {finalResults && testPhase === "complete" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
                <CardHeader>
                  <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Test Results Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {finalResults.downloadSpeed.toFixed(2)} {speedUnit}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Download Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {finalResults.uploadSpeed.toFixed(2)} {speedUnit}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Upload Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                        {finalResults.ping.toFixed(0)} ms
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Ping Latency</div>
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
