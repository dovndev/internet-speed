"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Wifi } from "lucide-react"

interface LiveMetricsDisplayProps {
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter?: number
  packetLoss?: number
  isActive: boolean
  testPhase: "idle" | "ping" | "download" | "upload" | "complete"
}

export default function LiveMetricsDisplay({
  downloadSpeed,
  uploadSpeed,
  ping,
  jitter = 0,
  packetLoss = 0,
  isActive,
  testPhase,
}: LiveMetricsDisplayProps) {
  const [animatedDownload, setAnimatedDownload] = useState(0)
  const [animatedUpload, setAnimatedUpload] = useState(0)
  const [animatedPing, setAnimatedPing] = useState(0)
  const [blinkState, setBlinkState] = useState(false)

  // Smooth animation for values
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedDownload((prev) => {
        const diff = downloadSpeed - prev
        return prev + diff * 0.2
      })

      setAnimatedUpload((prev) => {
        const diff = uploadSpeed - prev
        return prev + diff * 0.2
      })

      setAnimatedPing((prev) => {
        const diff = ping - prev
        return prev + diff * 0.2
      })
    }, 50)

    return () => clearInterval(interval)
  }, [downloadSpeed, uploadSpeed, ping])

  // Blinking effect for active metrics
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setBlinkState((prev) => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [isActive])

  const getPingQuality = (pingValue: number) => {
    if (pingValue === 0) return { label: "—", color: "bg-gray-800 text-gray-400" }
    if (pingValue < 20) return { label: "Excellent", color: "bg-green-900 text-green-400" }
    if (pingValue < 50) return { label: "Good", color: "bg-cyan-900 text-cyan-400" }
    if (pingValue < 100) return { label: "Fair", color: "bg-yellow-900 text-yellow-400" }
    return { label: "Poor", color: "bg-red-900 text-red-400" }
  }

  const pingQuality = getPingQuality(ping)

  const getActiveClass = (phase: string, type: string) => {
    if (!isActive) return ""
    if (phase !== type) return ""
    return blinkState ? "opacity-100" : "opacity-70"
  }

  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-3xl mx-auto">
      {/* Download */}
      <div
        className={`flex flex-col items-center transition-opacity duration-300 ${getActiveClass(testPhase, "download")}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <ArrowDown className="w-5 h-5 text-cyan-400" />
          <span className="text-gray-300 font-medium">DOWNLOAD</span>
        </div>
        <div className="text-4xl font-bold text-cyan-400 tabular-nums">{animatedDownload.toFixed(2)}</div>
        <div className="text-gray-400 text-sm">Mbps</div>
      </div>

      {/* Upload */}
      <div
        className={`flex flex-col items-center transition-opacity duration-300 ${getActiveClass(testPhase, "upload")}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <ArrowUp className="w-5 h-5 text-purple-400" />
          <span className="text-gray-300 font-medium">UPLOAD</span>
        </div>
        <div className="text-4xl font-bold text-purple-400 tabular-nums">{animatedUpload.toFixed(2)}</div>
        <div className="text-gray-400 text-sm">Mbps</div>
      </div>

      {/* Ping */}
      <div
        className={`flex flex-col items-center transition-opacity duration-300 ${getActiveClass(testPhase, "ping")}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Wifi className="w-5 h-5 text-yellow-400" />
          <span className="text-gray-300 font-medium">PING</span>
        </div>
        <div className="text-4xl font-bold text-yellow-400 tabular-nums">{animatedPing.toFixed(0)}</div>
        <div className="text-gray-400 text-sm">ms</div>
        <Badge className={`mt-2 ${pingQuality.color}`}>{pingQuality.label}</Badge>
      </div>

      {/* Additional metrics in a row below */}
      <div className="col-span-3 grid grid-cols-2 gap-4 mt-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-400">Jitter:</span>
          <span className="text-gray-300 font-medium">{jitter.toFixed(1)} ms</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-400">Packet Loss:</span>
          <span className="text-gray-300 font-medium">{packetLoss.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
