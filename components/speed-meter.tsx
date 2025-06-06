"use client"

import { useEffect, useState, useRef } from "react"
import { type SpeedUnit, convertSpeed } from "@/lib/speed-test-libraries"

interface SpeedMeterProps {
  value: number
  maxValue: number
  color: string
  label: string
  unit: SpeedUnit
  showBytes?: boolean
  theme: "default" | "neon" | "minimal" | "gauge"
  size?: "sm" | "md" | "lg"
}

export default function SpeedMeter({
  value,
  maxValue,
  color,
  label,
  unit,
  showBytes = false,
  theme,
  size = "md",
}: SpeedMeterProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Convert to bytes if needed
  const displayValue = showBytes ? convertSpeed(value, "Mbps", unit) : value
  const displayUnit = unit

  // Size configuration
  const sizeConfig = {
    sm: { width: 100, height: 100, fontSize: 12, thickness: 6 },
    md: { width: 150, height: 150, fontSize: 16, thickness: 8 },
    lg: { width: 200, height: 200, fontSize: 20, thickness: 10 },
  }[size]

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height, thickness } = sizeConfig
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(centerX, centerY) - thickness / 2

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = theme === "neon" ? "#001122" : "#e5e7eb"
    ctx.lineWidth = thickness
    ctx.stroke()

    // Calculate percentage
    const percentage = Math.min((animatedValue / maxValue) * 100, 100)
    const startAngle = -Math.PI / 2 // Start from top
    const endAngle = startAngle + (2 * Math.PI * percentage) / 100

    // Draw progress arc
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.strokeStyle = getColorValue(color, theme)
    ctx.lineWidth = thickness
    ctx.lineCap = "round"
    ctx.stroke()

    // Draw gauge needle if theme is gauge
    if (theme === "gauge") {
      const needleLength = radius - 10
      const needleAngle = startAngle + (2 * Math.PI * percentage) / 100
      const needleX = centerX + needleLength * Math.cos(needleAngle)
      const needleY = centerY + needleLength * Math.sin(needleAngle)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(needleX, needleY)
      ctx.strokeStyle = getColorValue(color, theme)
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw center circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI)
      ctx.fillStyle = getColorValue(color, theme)
      ctx.fill()
    }
  }, [animatedValue, maxValue, color, theme, sizeConfig])

  const getColorValue = (color: string, theme: string) => {
    if (theme === "neon") {
      return (
        {
          green: "#00ff88",
          blue: "#0088ff",
          yellow: "#ffff00",
          orange: "#ff8800",
          red: "#ff0044",
        }[color] || "#00ff88"
      )
    }
    return (
      {
        green: "#22c55e",
        blue: "#3b82f6",
        yellow: "#eab308",
        orange: "#f97316",
        red: "#ef4444",
      }[color] || "#22c55e"
    )
  }

  const { width, height, fontSize } = sizeConfig

  const percentage = Math.min((animatedValue / maxValue) * 100, 100)

  return (
    <div className="relative" style={{ width, height }}>
      <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={`font-bold ${theme === "neon" ? "text-white" : "text-gray-900"}`}
          style={{ fontSize: fontSize * 1.25 }}
        >
          {displayValue.toFixed(1)}
        </div>
        <div
          className={`text-center ${theme === "neon" ? "text-gray-300" : "text-gray-500"}`}
          style={{ fontSize: fontSize * 0.75 }}
        >
          {displayUnit}
        </div>
        <div
          className={`text-center ${theme === "neon" ? "text-gray-400" : "text-gray-600"}`}
          style={{ fontSize: fontSize * 0.7 }}
        >
          {label}
        </div>
      </div>

      {/* Shadow effect for neon theme */}
      {theme === "neon" && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: `0 0 15px ${getColorValue(color, "neon")}`,
            opacity: percentage / 200 + 0.1,
          }}
        />
      )}
    </div>
  )
}
