"use client"

import { useEffect, useState, useRef } from "react"
import { type SpeedUnit, convertSpeed } from "@/lib/speed-test-libraries"

interface RotatingSpeedMeterProps {
  value: number
  maxValue: number
  unit: SpeedUnit
  label: string
  color?: "download" | "upload" | "ping"
  showBytes?: boolean
  isActive?: boolean
}

export default function RotatingSpeedMeter({
  value,
  maxValue,
  unit,
  label,
  color = "download",
  showBytes = false,
  isActive = false,
}: RotatingSpeedMeterProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Convert to bytes if needed
  const displayValue = showBytes ? convertSpeed(value, "Mbps", unit) : value
  const displayUnit = unit

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

    const width = 200
    const height = 200
    const centerX = width / 2
    const centerY = height / 2
    const radius = 80

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Calculate rotation based on value
    const percentage = Math.min(animatedValue / maxValue, 1)
    const rotation = percentage * Math.PI * 1.5 // 270 degrees max

    // Get colors based on type
    const colors = getColors(color)

    // Draw outer ring
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI)
    ctx.strokeStyle = "#f1f5f9"
    ctx.lineWidth = 20
    ctx.stroke()

    // Draw active arc
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 10, -Math.PI / 2, -Math.PI / 2 + rotation)
    ctx.strokeStyle = colors.primary
    ctx.lineWidth = 20
    ctx.lineCap = "round"
    ctx.stroke()

    // Draw scale marks
    const totalMarks = 20
    for (let i = 0; i <= totalMarks; i++) {
      const angle = -Math.PI / 2 + (Math.PI * 1.5 * i) / totalMarks
      const markValue = (maxValue * i) / totalMarks

      // Determine mark size
      const isMainMark = i % 5 === 0
      const markLength = isMainMark ? 15 : 8
      const markWidth = isMainMark ? 3 : 1

      const innerRadius = radius - 5
      const outerRadius = radius - 5 + markLength

      const x1 = centerX + innerRadius * Math.cos(angle)
      const y1 = centerY + innerRadius * Math.sin(angle)
      const x2 = centerX + outerRadius * Math.cos(angle)
      const y2 = centerY + outerRadius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = "#64748b"
      ctx.lineWidth = markWidth
      ctx.stroke()

      // Add numbers for main marks
      if (isMainMark && i <= totalMarks) {
        const textRadius = radius + 25
        const textX = centerX + textRadius * Math.cos(angle)
        const textY = centerY + textRadius * Math.sin(angle)

        ctx.fillStyle = "#475569"
        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(markValue.toFixed(0), textX, textY)
      }
    }

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = colors.primary
    ctx.fill()

    // Draw pointer
    const pointerAngle = -Math.PI / 2 + rotation
    const pointerLength = radius - 20
    const pointerX = centerX + pointerLength * Math.cos(pointerAngle)
    const pointerY = centerY + pointerLength * Math.sin(pointerAngle)

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(pointerX, pointerY)
    ctx.strokeStyle = colors.primary
    ctx.lineWidth = 4
    ctx.lineCap = "round"
    ctx.stroke()

    // Add glow effect if active
    if (isActive) {
      ctx.shadowColor = colors.primary
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius + 10, -Math.PI / 2, -Math.PI / 2 + rotation)
      ctx.strokeStyle = colors.primary
      ctx.lineWidth = 20
      ctx.lineCap = "round"
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }, [animatedValue, maxValue, color, isActive])

  const getColors = (colorType: string) => {
    switch (colorType) {
      case "download":
        return { primary: "#10b981", secondary: "#d1fae5" }
      case "upload":
        return { primary: "#3b82f6", secondary: "#dbeafe" }
      case "ping":
        return { primary: "#f59e0b", secondary: "#fef3c7" }
      default:
        return { primary: "#6b7280", secondary: "#f3f4f6" }
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      <canvas ref={canvasRef} width={200} height={200} className="drop-shadow-sm" />

      {/* Center display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-gray-800">{displayValue.toFixed(1)}</div>
        <div className="text-sm text-gray-600 font-medium">{displayUnit}</div>
      </div>

      {/* Label */}
      <div className="mt-2 text-center">
        <div className="font-semibold text-gray-700">{label}</div>
      </div>
    </div>
  )
}
