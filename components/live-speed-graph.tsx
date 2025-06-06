"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Upload, Wifi } from "lucide-react"
import { type SpeedUnit, convertSpeed } from "@/lib/speed-test-libraries"

interface DataPoint {
  timestamp: number
  value: number
}

interface LiveSpeedGraphProps {
  type: "download" | "upload" | "ping"
  data: DataPoint[]
  currentValue: number
  maxValue: number
  unit: SpeedUnit
  showBytes?: boolean
  height?: number
}

export default function LiveSpeedGraph({
  type,
  data,
  currentValue,
  maxValue,
  unit,
  showBytes = false,
  height = 150,
}: LiveSpeedGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height })

  // Convert to bytes if needed
  const displayValue = showBytes ? convertSpeed(currentValue, "Mbps", unit) : currentValue
  const displayUnit = unit

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        setDimensions({
          width: canvasRef.current.parentElement.clientWidth,
          height,
        })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [height])

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    // Set up graph dimensions
    const padding = { top: 10, right: 10, bottom: 20, left: 40 }
    const graphWidth = dimensions.width - padding.left - padding.right
    const graphHeight = dimensions.height - padding.top - padding.bottom

    // Find min and max values
    const minValue = 0
    const maxDataValue = Math.max(
      ...data.map((point) => point.value),
      maxValue * 0.1, // Ensure we have at least 10% of maxValue
    )
    const effectiveMaxValue = Math.min(maxDataValue * 1.2, maxValue) // 20% headroom but not more than maxValue

    // Find time range
    const minTime = data[0].timestamp
    const maxTime = data[data.length - 1].timestamp
    const timeRange = maxTime - minTime

    // Draw axes
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, dimensions.height - padding.bottom)
    ctx.stroke()

    // X-axis
    ctx.beginPath()
    ctx.moveTo(padding.left, dimensions.height - padding.bottom)
    ctx.lineTo(dimensions.width - padding.right, dimensions.height - padding.bottom)
    ctx.stroke()

    // Draw Y-axis labels
    ctx.fillStyle = "#6b7280"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    const ySteps = 5
    for (let i = 0; i <= ySteps; i++) {
      const value = (effectiveMaxValue * i) / ySteps
      const y = padding.top + graphHeight - (graphHeight * i) / ySteps
      ctx.fillText(value.toFixed(1), padding.left - 5, y)

      // Draw horizontal grid line
      ctx.strokeStyle = "#f3f4f6"
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(dimensions.width - padding.right, y)
      ctx.stroke()
    }

    // Draw data line
    if (data.length > 1) {
      ctx.strokeStyle = getTypeColor(type)
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((point, index) => {
        const x = padding.left + (graphWidth * (point.timestamp - minTime)) / timeRange
        const y = padding.top + graphHeight - (graphHeight * point.value) / effectiveMaxValue

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Fill area under the line
      ctx.fillStyle = `${getTypeColor(type)}20` // 20% opacity
      ctx.beginPath()
      ctx.moveTo(padding.left, dimensions.height - padding.bottom)

      data.forEach((point) => {
        const x = padding.left + (graphWidth * (point.timestamp - minTime)) / timeRange
        const y = padding.top + graphHeight - (graphHeight * point.value) / effectiveMaxValue
        ctx.lineTo(x, y)
      })

      ctx.lineTo(padding.left + graphWidth, dimensions.height - padding.bottom)
      ctx.closePath()
      ctx.fill()

      // Draw data points
      ctx.fillStyle = getTypeColor(type)
      data.forEach((point) => {
        const x = padding.left + (graphWidth * (point.timestamp - minTime)) / timeRange
        const y = padding.top + graphHeight - (graphHeight * point.value) / effectiveMaxValue
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      })
    }

    // Draw current value label
    ctx.fillStyle = "#111827"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(`Current: ${displayValue.toFixed(2)} ${displayUnit}`, padding.left, padding.top)
  }, [data, dimensions, maxValue, type, displayValue, displayUnit, showBytes])

  const getTypeColor = (type: "download" | "upload" | "ping") => {
    switch (type) {
      case "download":
        return "#22c55e" // green
      case "upload":
        return "#3b82f6" // blue
      case "ping":
        return "#eab308" // yellow
    }
  }

  const getTypeIcon = (type: "download" | "upload" | "ping") => {
    switch (type) {
      case "download":
        return <Download className="w-4 h-4" />
      case "upload":
        return <Upload className="w-4 h-4" />
      case "ping":
        return <Wifi className="w-4 h-4" />
    }
  }

  const getTypeTitle = (type: "download" | "upload" | "ping") => {
    switch (type) {
      case "download":
        return "Download Speed"
      case "upload":
        return "Upload Speed"
      case "ping":
        return "Ping Latency"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getTypeIcon(type)}
          {getTypeTitle(type)} (Live)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full" style={{ height: `${height}px` }}>
          <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
          {data.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Waiting for data...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
