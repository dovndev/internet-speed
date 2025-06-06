"use client"

import { useEffect, useState, useRef } from "react"
import { type SpeedUnit, convertSpeed } from "@/lib/speed-test-libraries"

interface CarSpeedometerProps {
  value: number
  maxValue: number
  unit: SpeedUnit
  label: string
  color?: "blue" | "green" | "red"
  size?: "sm" | "md" | "lg"
  showBytes?: boolean
}

export default function CarSpeedometer({
  value,
  maxValue,
  unit,
  label,
  color = "blue",
  size = "md",
  showBytes = false,
}: CarSpeedometerProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Convert to bytes if needed
  const displayValue = showBytes ? convertSpeed(value, "Mbps", unit) : value
  const displayUnit = unit

  // Size configuration
  const sizeConfig = {
    sm: { width: 200, height: 200, fontSize: 14 },
    md: { width: 280, height: 280, fontSize: 18 },
    lg: { width: 360, height: 360, fontSize: 24 },
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

    const { width, height } = sizeConfig
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(centerX, centerY) - 20

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Create gradient for the outer ring
    const outerGradient = ctx.createRadialGradient(centerX, centerY, radius - 30, centerX, centerY, radius)
    outerGradient.addColorStop(0, "#1f2937")
    outerGradient.addColorStop(1, "#374151")

    // Draw outer ring (speedometer bezel)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = outerGradient
    ctx.fill()
    ctx.strokeStyle = "#6b7280"
    ctx.lineWidth = 2
    ctx.stroke()

    // Create gradient for the inner area
    const innerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius - 30)
    innerGradient.addColorStop(0, "#111827")
    innerGradient.addColorStop(1, "#1f2937")

    // Draw inner area
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 30, 0, 2 * Math.PI)
    ctx.fillStyle = innerGradient
    ctx.fill()

    // Draw speed markings
    const startAngle = -Math.PI * 0.75 // Start at 7:30 position
    const endAngle = Math.PI * 0.75 // End at 4:30 position
    const totalAngle = endAngle - startAngle

    // Major tick marks and numbers
    const majorTicks = 10
    for (let i = 0; i <= majorTicks; i++) {
      const angle = startAngle + (totalAngle * i) / majorTicks
      const tickValue = (maxValue * i) / majorTicks

      // Major tick mark
      const innerRadius = radius - 45
      const outerRadius = radius - 25
      const x1 = centerX + innerRadius * Math.cos(angle)
      const y1 = centerY + innerRadius * Math.sin(angle)
      const x2 = centerX + outerRadius * Math.cos(angle)
      const y2 = centerY + outerRadius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = "#9ca3af"
      ctx.lineWidth = 3
      ctx.stroke()

      // Numbers
      const textRadius = radius - 60
      const textX = centerX + textRadius * Math.cos(angle)
      const textY = centerY + textRadius * Math.sin(angle)

      ctx.fillStyle = "#f3f4f6"
      ctx.font = `${sizeConfig.fontSize - 4}px Arial`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(tickValue.toFixed(0), textX, textY)
    }

    // Minor tick marks
    const minorTicks = 50
    for (let i = 0; i <= minorTicks; i++) {
      const angle = startAngle + (totalAngle * i) / minorTicks
      const innerRadius = radius - 40
      const outerRadius = radius - 30
      const x1 = centerX + innerRadius * Math.cos(angle)
      const y1 = centerY + innerRadius * Math.sin(angle)
      const x2 = centerX + outerRadius * Math.cos(angle)
      const y2 = centerY + outerRadius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = "#6b7280"
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw colored arc based on current value
    const valueAngle = startAngle + (totalAngle * Math.min(animatedValue, maxValue)) / maxValue
    const arcRadius = radius - 37

    ctx.beginPath()
    ctx.arc(centerX, centerY, arcRadius, startAngle, valueAngle)
    ctx.strokeStyle = getSpeedColor(animatedValue, maxValue, color)
    ctx.lineWidth = 8
    ctx.lineCap = "round"
    ctx.stroke()

    // Draw needle
    const needleLength = radius - 50
    const needleAngle = startAngle + (totalAngle * Math.min(animatedValue, maxValue)) / maxValue

    // Needle shadow
    ctx.save()
    ctx.translate(centerX + 2, centerY + 2)
    ctx.rotate(needleAngle)
    ctx.beginPath()
    ctx.moveTo(-10, 0)
    ctx.lineTo(needleLength - 20, -3)
    ctx.lineTo(needleLength, 0)
    ctx.lineTo(needleLength - 20, 3)
    ctx.closePath()
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
    ctx.fill()
    ctx.restore()

    // Needle
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(needleAngle)
    ctx.beginPath()
    ctx.moveTo(-10, 0)
    ctx.lineTo(needleLength - 20, -3)
    ctx.lineTo(needleLength, 0)
    ctx.lineTo(needleLength - 20, 3)
    ctx.closePath()
    ctx.fillStyle = "#ef4444"
    ctx.fill()
    ctx.strokeStyle = "#dc2626"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()

    // Center hub
    const hubGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15)
    hubGradient.addColorStop(0, "#6b7280")
    hubGradient.addColorStop(1, "#374151")

    ctx.beginPath()
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI)
    ctx.fillStyle = hubGradient
    ctx.fill()
    ctx.strokeStyle = "#9ca3af"
    ctx.lineWidth = 2
    ctx.stroke()

    // Center dot
    ctx.beginPath()
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI)
    ctx.fillStyle = "#ef4444"
    ctx.fill()
  }, [animatedValue, maxValue, sizeConfig, color])

  const getSpeedColor = (speed: number, max: number, colorTheme: string) => {
    const percentage = speed / max

    if (colorTheme === "green") {
      if (percentage < 0.3) return "#22c55e"
      if (percentage < 0.7) return "#16a34a"
      return "#15803d"
    } else if (colorTheme === "red") {
      if (percentage < 0.3) return "#ef4444"
      if (percentage < 0.7) return "#dc2626"
      return "#b91c1c"
    } else {
      if (percentage < 0.3) return "#3b82f6"
      if (percentage < 0.7) return "#2563eb"
      return "#1d4ed8"
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      <canvas ref={canvasRef} width={sizeConfig.width} height={sizeConfig.height} className="drop-shadow-lg" />

      {/* Digital display */}
      <div className="absolute bottom-16 bg-black/80 text-green-400 px-4 py-2 rounded-lg font-mono text-center border border-gray-600">
        <div className="text-2xl font-bold">{displayValue.toFixed(1)}</div>
        <div className="text-sm opacity-80">{displayUnit}</div>
      </div>

      {/* Label */}
      <div className="mt-2 text-center">
        <div className="font-semibold text-gray-800">{label}</div>
      </div>
    </div>
  )
}
