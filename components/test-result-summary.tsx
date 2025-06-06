"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Download, Upload, Wifi, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TestResultSummaryProps {
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
  ispName?: string
  location?: string
  timestamp?: Date
}

export default function TestResultSummary({
  downloadSpeed,
  uploadSpeed,
  ping,
  jitter,
  packetLoss,
  ispName = "Unknown ISP",
  location = "Unknown Location",
  timestamp = new Date(),
}: TestResultSummaryProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

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
    if (speed >= threshold * 2) return { label: "Excellent", color: "text-green-400" }
    if (speed >= threshold) return { label: "Good", color: "text-cyan-400" }
    if (speed >= threshold * 0.5) return { label: "Fair", color: "text-yellow-400" }
    return { label: "Poor", color: "text-red-400" }
  }

  const downloadRating = getSpeedRating(downloadSpeed, "download")
  const uploadRating = getSpeedRating(uploadSpeed, "upload")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto bg-gray-900 rounded-lg overflow-hidden"
    >
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Test Results</h2>
          <div className="text-gray-400 text-sm">{formatDate(timestamp)}</div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Download */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-300 font-medium">Download</span>
            </div>
            <div className="text-3xl font-bold text-cyan-400 mb-1">{downloadSpeed.toFixed(2)} Mbps</div>
            <div className={`text-sm ${downloadRating.color}`}>{downloadRating.label}</div>
          </div>

          {/* Upload */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300 font-medium">Upload</span>
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-1">{uploadSpeed.toFixed(2)} Mbps</div>
            <div className={`text-sm ${uploadRating.color}`}>{uploadRating.label}</div>
          </div>

          {/* Ping */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300 font-medium">Ping</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-1">{ping.toFixed(0)} ms</div>
            <div className="text-sm text-gray-400">Jitter: {jitter.toFixed(1)} ms</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-gray-400">
            <div>{ispName}</div>
            <div className="text-sm text-gray-500">{location}</div>
          </div>

          <Button variant="outline" className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700">
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
