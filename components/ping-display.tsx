"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Wifi, Signal } from "lucide-react"

interface PingDisplayProps {
  ping: number
  jitter?: number
  size?: "sm" | "md" | "lg"
}

export default function PingDisplay({ ping, jitter = 0, size = "md" }: PingDisplayProps) {
  const [animatedPing, setAnimatedPing] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPing(ping)
    }, 100)
    return () => clearTimeout(timer)
  }, [ping])

  const getPingQuality = (pingValue: number) => {
    if (pingValue === 0) return { label: "No Data", color: "text-gray-500", bgColor: "bg-gray-100" }
    if (pingValue < 20) return { label: "Excellent", color: "text-green-700", bgColor: "bg-green-100" }
    if (pingValue < 50) return { label: "Good", color: "text-blue-700", bgColor: "bg-blue-100" }
    if (pingValue < 100) return { label: "Fair", color: "text-yellow-700", bgColor: "bg-yellow-100" }
    return { label: "Poor", color: "text-red-700", bgColor: "bg-red-100" }
  }

  const quality = getPingQuality(animatedPing)

  const sizeConfig = {
    sm: { textSize: "text-3xl", cardPadding: "p-4" },
    md: { textSize: "text-5xl", cardPadding: "p-6" },
    lg: { textSize: "text-7xl", cardPadding: "p-8" },
  }[size]

  const getSignalBars = (pingValue: number) => {
    if (pingValue === 0) return 0
    if (pingValue < 20) return 5
    if (pingValue < 50) return 4
    if (pingValue < 100) return 3
    if (pingValue < 200) return 2
    return 1
  }

  const signalBars = getSignalBars(animatedPing)

  return (
    <Card className="relative overflow-hidden">
      <CardContent className={`${sizeConfig.cardPadding} text-center space-y-4`}>
        {/* Signal strength indicator */}
        <div className="flex justify-center items-end space-x-1">
          {[1, 2, 3, 4, 5].map((bar) => (
            <div
              key={bar}
              className={`w-2 rounded-t transition-all duration-500 ${
                bar <= signalBars ? quality.color.replace("text-", "bg-") : "bg-gray-300"
              }`}
              style={{ height: `${bar * 4 + 8}px` }}
            />
          ))}
        </div>

        {/* Ping value */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Wifi className="w-6 h-6 text-gray-600" />
            <span className="text-lg font-medium text-gray-600">Average Ping</span>
          </div>

          <div className={`${sizeConfig.textSize} font-bold ${quality.color} transition-all duration-500`}>
            {animatedPing > 0 ? `${animatedPing.toFixed(0)}` : "—"}
            {animatedPing > 0 && <span className="text-lg ml-1">ms</span>}
          </div>

          <div
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${quality.bgColor} ${quality.color}`}
          >
            {quality.label}
          </div>
        </div>

        {/* Jitter display */}
        {jitter > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Jitter: <span className="font-medium">{jitter.toFixed(1)} ms</span>
            </div>
          </div>
        )}

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
          <Signal className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  )
}
