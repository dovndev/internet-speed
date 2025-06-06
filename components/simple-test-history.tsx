"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Trash2, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { type SpeedUnit, convertSpeed } from "@/lib/speed-test-libraries"

interface SpeedTestResult {
  id: string
  timestamp: Date
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
}

interface SimpleTestHistoryProps {
  history: SpeedTestResult[]
  speedUnit: SpeedUnit
  onClearHistory?: () => void
}

export default function SimpleTestHistory({ history, speedUnit, onClearHistory }: SimpleTestHistoryProps) {
  const formatSpeed = (speed: number, unit: SpeedUnit) => {
    const converted = convertSpeed(speed, "Mbps", unit)
    return converted.toFixed(1)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getSpeedTrend = (currentSpeed: number, previousSpeed: number) => {
    if (!previousSpeed) return null
    const diff = currentSpeed - previousSpeed
    const percentage = (diff / previousSpeed) * 100

    if (Math.abs(percentage) < 5) return null

    return {
      isUp: diff > 0,
      percentage: Math.abs(percentage),
    }
  }

  const getSpeedRating = (speed: number, type: "download" | "upload") => {
    const threshold = type === "download" ? 25 : 10
    if (speed >= threshold * 2) return { label: "Excellent", color: "bg-green-100 text-green-700" }
    if (speed >= threshold) return { label: "Good", color: "bg-blue-100 text-blue-700" }
    if (speed >= threshold * 0.5) return { label: "Fair", color: "bg-yellow-100 text-yellow-700" }
    return { label: "Poor", color: "bg-red-100 text-red-700" }
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-600">No Test History</h3>
          <p className="text-gray-500">Run your first speed test to see results here</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate averages
  const avgDownload = history.reduce((sum, test) => sum + test.downloadSpeed, 0) / history.length
  const avgUpload = history.reduce((sum, test) => sum + test.uploadSpeed, 0) / history.length
  const avgPing = history.reduce((sum, test) => sum + test.ping, 0) / history.length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatSpeed(avgDownload, speedUnit)} {speedUnit}
            </div>
            <div className="text-sm text-gray-600">Average Download</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatSpeed(avgUpload, speedUnit)} {speedUnit}
            </div>
            <div className="text-sm text-gray-600">Average Upload</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{avgPing.toFixed(0)} ms</div>
            <div className="text-sm text-gray-600">Average Ping</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Tests ({history.length})
            </span>
            {onClearHistory && (
              <Button variant="outline" size="sm" onClick={onClearHistory}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.slice(0, 5).map((test, index) => {
              const downloadTrend =
                index < history.length - 1 ? getSpeedTrend(test.downloadSpeed, history[index + 1].downloadSpeed) : null
              const uploadTrend =
                index < history.length - 1 ? getSpeedTrend(test.uploadSpeed, history[index + 1].uploadSpeed) : null
              const downloadRating = getSpeedRating(test.downloadSpeed, "download")
              const uploadRating = getSpeedRating(test.uploadSpeed, "upload")

              return (
                <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600 min-w-[80px]">{formatDate(test.timestamp)}</div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        ↓ {formatSpeed(test.downloadSpeed, speedUnit)} {speedUnit}
                      </span>
                      {downloadTrend && (
                        <div
                          className={`flex items-center gap-1 text-xs ${downloadTrend.isUp ? "text-green-600" : "text-red-600"}`}
                        >
                          {downloadTrend.isUp ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {downloadTrend.percentage.toFixed(0)}%
                        </div>
                      )}
                      <Badge className={downloadRating.color} variant="secondary">
                        {downloadRating.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        ↑ {formatSpeed(test.uploadSpeed, speedUnit)} {speedUnit}
                      </span>
                      {uploadTrend && (
                        <div
                          className={`flex items-center gap-1 text-xs ${uploadTrend.isUp ? "text-green-600" : "text-red-600"}`}
                        >
                          {uploadTrend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {uploadTrend.percentage.toFixed(0)}%
                        </div>
                      )}
                      <Badge className={uploadRating.color} variant="secondary">
                        {uploadRating.label}
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-600">{test.ping.toFixed(0)} ms</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
