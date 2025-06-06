"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, Trash2, Calendar } from "lucide-react"
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

interface TestHistoryProps {
  history: SpeedTestResult[]
  speedUnit: SpeedUnit
}

export default function TestHistory({ history, speedUnit }: TestHistoryProps) {
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

  const getSpeedRating = (speed: number, type: "download" | "upload") => {
    const threshold = type === "download" ? 25 : 10
    if (speed >= threshold * 2) return "excellent"
    if (speed >= threshold) return "good"
    if (speed >= threshold * 0.5) return "fair"
    return "poor"
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "fair":
        return "bg-yellow-100 text-yellow-800"
      case "poor":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Test History</h3>
          <p className="text-muted-foreground">Run your first speed test to see results here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Test History ({history.length})
            </span>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Clear History
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Download</TableHead>
                <TableHead>Upload</TableHead>
                <TableHead>Ping</TableHead>
                <TableHead>Jitter</TableHead>
                <TableHead>Packet Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>{formatDate(test.timestamp)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatSpeed(test.downloadSpeed, speedUnit)} {speedUnit}
                      <Badge className={getRatingColor(getSpeedRating(test.downloadSpeed, "download"))}>
                        {getSpeedRating(test.downloadSpeed, "download")}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatSpeed(test.uploadSpeed, speedUnit)} {speedUnit}
                      <Badge className={getRatingColor(getSpeedRating(test.uploadSpeed, "upload"))}>
                        {getSpeedRating(test.uploadSpeed, "upload")}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{test.ping} ms</TableCell>
                  <TableCell>{test.jitter} ms</TableCell>
                  <TableCell>{test.packetLoss}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>\
    </div>
