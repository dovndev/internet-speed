"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Play,
  Square,
  RotateCcw,
  Settings,
  TrendingUp,
  Wifi,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import RotatingSpeedMeter from "@/components/rotating-speed-meter"
import LiveSpeedGraph from "@/components/live-speed-graph"
import type { SpeedUnit } from "@/lib/speed-test-libraries"

interface SpeedTestResult {
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
}

interface LiveDataPoint {
  timestamp: number
  value: number
}

interface InteractiveSpeedDashboardProps {
  currentTest: Partial<SpeedTestResult>
  isTestRunning: boolean
  testProgress: number
  testPhase: "idle" | "ping" | "download" | "upload" | "complete"
  error: string | null
  selectedLibrary: string
  speedUnit: SpeedUnit
  onRunTest: () => void
  onStopTest: () => void
  onResetTest: () => void
  onLibraryChange: (library: string) => void
  onUnitChange: (unit: SpeedUnit) => void
  liveData?: {
    download: LiveDataPoint[]
    upload: LiveDataPoint[]
    ping: LiveDataPoint[]
  }
}

export default function InteractiveSpeedDashboard({
  currentTest,
  isTestRunning,
  testProgress,
  testPhase,
  error,
  selectedLibrary,
  speedUnit,
  onRunTest,
  onStopTest,
  onResetTest,
  onLibraryChange,
  onUnitChange,
  liveData,
}: InteractiveSpeedDashboardProps) {
  const [showLiveGraphs, setShowLiveGraphs] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  const getPingQuality = (ping: number) => {
    if (ping === 0) return { label: "No Data", color: "bg-gray-100 text-gray-600" }
    if (ping < 20) return { label: "Excellent", color: "bg-green-100 text-green-700" }
    if (ping < 50) return { label: "Good", color: "bg-blue-100 text-blue-700" }
    if (ping < 100) return { label: "Fair", color: "bg-yellow-100 text-yellow-700" }
    return { label: "Poor", color: "bg-red-100 text-red-700" }
  }

  const pingQuality = getPingQuality(currentTest.ping || 0)
  const isByteUnit = speedUnit === "MBps" || speedUnit === "KBps" || speedUnit === "Bps"

  return (
    <div className="space-y-6">
      {/* Main Control Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Internet Speed Test</h2>
              <p className="text-gray-600">{getPhaseMessage()}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={onRunTest}
                disabled={isTestRunning}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                <Play className="w-5 h-5 mr-2" />
                {isTestRunning ? "Testing..." : "Start Test"}
              </Button>
              {isTestRunning && (
                <Button onClick={onStopTest} variant="outline" size="lg">
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>
          </div>

          {isTestRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{testProgress.toFixed(0)}%</span>
              </div>
              <Progress value={testProgress} className="h-3" />
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Speed Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Download Speed */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Download className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Download</h3>
            </div>
            <RotatingSpeedMeter
              value={currentTest.downloadSpeed || 0}
              maxValue={200}
              unit={speedUnit}
              label=""
              color="download"
              showBytes={isByteUnit}
              isActive={testPhase === "download"}
            />
            <div className="mt-4 text-sm text-gray-600">
              Average: {(currentTest.downloadSpeed || 0).toFixed(1)} {speedUnit}
            </div>
          </CardContent>
        </Card>

        {/* Upload Speed */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Upload</h3>
            </div>
            <RotatingSpeedMeter
              value={currentTest.uploadSpeed || 0}
              maxValue={100}
              unit={speedUnit}
              label=""
              color="upload"
              showBytes={isByteUnit}
              isActive={testPhase === "upload"}
            />
            <div className="mt-4 text-sm text-gray-600">
              Average: {(currentTest.uploadSpeed || 0).toFixed(1)} {speedUnit}
            </div>
          </CardContent>
        </Card>

        {/* Ping */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Wifi className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-800">Ping</h3>
            </div>
            <div className="space-y-4">
              <div className="text-4xl font-bold text-gray-800">
                {currentTest.ping ? `${currentTest.ping.toFixed(0)}` : "—"}
                {currentTest.ping && <span className="text-lg ml-1">ms</span>}
              </div>
              <Badge className={pingQuality.color}>{pingQuality.label}</Badge>
              {currentTest.jitter && (
                <div className="text-sm text-gray-600">Jitter: {currentTest.jitter.toFixed(1)} ms</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Settings */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Live Graphs</span>
                <Switch checked={showLiveGraphs} onCheckedChange={setShowLiveGraphs} disabled={isTestRunning} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Unit:</span>
                <select
                  value={speedUnit}
                  onChange={(e) => onUnitChange(e.target.value as SpeedUnit)}
                  disabled={isTestRunning}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="Mbps">Mbps</option>
                  <option value="Kbps">Kbps</option>
                  <option value="MBps">MB/s</option>
                  <option value="KBps">KB/s</option>
                </select>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Advanced
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Test Library</label>
                  <select
                    value={selectedLibrary}
                    onChange={(e) => onLibraryChange(e.target.value)}
                    disabled={isTestRunning}
                    className="w-full mt-1 text-sm border rounded px-3 py-2"
                  >
                    <option value="ng-speed-test">NG Speed Test (Recommended)</option>
                    <option value="network-speed">Network Speed</option>
                    <option value="cloudflare">Cloudflare SpeedTest</option>
                    <option value="fallback">Fallback Method</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <Button onClick={onResetTest} variant="outline" size="sm" className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Graphs */}
      {showLiveGraphs && liveData && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Live Performance Graphs
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LiveSpeedGraph
                type="download"
                data={liveData.download}
                currentValue={currentTest.downloadSpeed || 0}
                maxValue={200}
                unit={speedUnit}
                showBytes={isByteUnit}
                height={120}
              />
              <LiveSpeedGraph
                type="upload"
                data={liveData.upload}
                currentValue={currentTest.uploadSpeed || 0}
                maxValue={100}
                unit={speedUnit}
                showBytes={isByteUnit}
                height={120}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {testPhase === "complete" && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Test Results Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(currentTest.downloadSpeed || 0).toFixed(1)} {speedUnit}
                </div>
                <div className="text-sm text-gray-600">Download Speed</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {(currentTest.uploadSpeed || 0).toFixed(1)} {speedUnit}
                </div>
                <div className="text-sm text-gray-600">Upload Speed</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{(currentTest.ping || 0).toFixed(0)} ms</div>
                <div className="text-sm text-gray-600">Ping Latency</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
