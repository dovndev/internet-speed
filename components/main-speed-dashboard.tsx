"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Square, RotateCcw, AlertCircle, Gauge } from "lucide-react"
import CarSpeedometer from "@/components/car-speedometer"
import PingDisplay from "@/components/ping-display"
import type { SpeedUnit } from "@/lib/speed-test-libraries"

interface SpeedTestResult {
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
}

interface MainSpeedDashboardProps {
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
  showBytes?: boolean
}

export default function MainSpeedDashboard({
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
  showBytes = false,
}: MainSpeedDashboardProps) {
  const getPhaseMessage = () => {
    switch (testPhase) {
      case "idle":
        return "Ready to test your connection"
      case "ping":
        return "Measuring latency and connection quality..."
      case "download":
        return "Testing download speed..."
      case "upload":
        return "Testing upload speed..."
      case "complete":
        return "Test completed successfully!"
      default:
        return "Ready to test your connection"
    }
  }

  const isByteUnit = speedUnit === "MBps" || speedUnit === "KBps" || speedUnit === "Bps"

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Internet Speed Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{getPhaseMessage()}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {selectedLibrary === "cloudflare"
                    ? "Cloudflare"
                    : selectedLibrary === "network-speed"
                      ? "Network Speed"
                      : selectedLibrary === "ng-speed-test"
                        ? "NG Speed Test"
                        : "Fallback"}
                </Badge>
                <span>•</span>
                <span>
                  {speedUnit} ({isByteUnit ? "byte-based" : "bit-based"})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onRunTest} disabled={isTestRunning} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                {isTestRunning ? "Testing..." : "Start Test"}
              </Button>
              {isTestRunning && (
                <Button onClick={onStopTest} variant="outline" className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              )}
              <Button onClick={onResetTest} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-red-800">Test Failed</div>
                <div className="text-red-700">{error}</div>
              </div>
            </div>
          )}

          {isTestRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{testProgress.toFixed(0)}%</span>
              </div>
              <Progress value={testProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Speed Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Download Speed */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg text-green-700">Download Speed</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CarSpeedometer
              value={currentTest.downloadSpeed || 0}
              maxValue={200}
              unit={speedUnit}
              label="Download"
              color="green"
              size="md"
              showBytes={showBytes}
            />
          </CardContent>
        </Card>

        {/* Upload Speed */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg text-blue-700">Upload Speed</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CarSpeedometer
              value={currentTest.uploadSpeed || 0}
              maxValue={100}
              unit={speedUnit}
              label="Upload"
              color="blue"
              size="md"
              showBytes={showBytes}
            />
          </CardContent>
        </Card>

        {/* Ping */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg text-yellow-700">Connection Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <PingDisplay ping={currentTest.ping || 0} jitter={currentTest.jitter || 0} size="md" />
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      {testPhase === "complete" && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {currentTest.downloadSpeed?.toFixed(1) || "0"} {speedUnit}
                </div>
                <div className="text-sm text-muted-foreground">Average Download</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {currentTest.uploadSpeed?.toFixed(1) || "0"} {speedUnit}
                </div>
                <div className="text-sm text-muted-foreground">Average Upload</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-yellow-600">{currentTest.ping?.toFixed(0) || "0"} ms</div>
                <div className="text-sm text-muted-foreground">Average Ping</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
