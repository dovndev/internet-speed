"use client"

import { useEffect, useRef, useState } from "react"
import type { SpeedUnit } from "@/lib/speed-test-libraries"

interface DarkSpeedometerProps {
  value: number
  maxValue: number
  unit: SpeedUnit
  color: "download" | "upload" | "ping"
  isActive?: boolean
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

export default function DarkSpeedometer({
  value,
  maxValue,
  unit,
  color,
  isActive = false,
  showLabel = true,
  size = "lg",
}: DarkSpeedometerProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()
  const valueRef = useRef<number>(0)
  const targetValueRef = useRef<number>(0)

  // Size configuration
  const sizeConfig = {
    sm: { width: 200, height: 200, fontSize: 24, labelSize: 12 },
    md: { width: 300, height: 300, fontSize: 36, labelSize: 14 },
    lg: { width: 400, height: 400, fontSize: 48, labelSize: 16 },
  }[size]

  // Update target value when prop changes
  useEffect(() => {
    targetValueRef.current = value
  }, [value])

  // Smooth animation loop
  const animate = (time: number) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time
    }

    const deltaTime = time - previousTimeRef.current
    previousTimeRef.current = time

    // Smooth easing towards target value
    const diff = targetValueRef.current - valueRef.current
    const speed = Math.max(Math.abs(diff) * 0.1, 0.1) // Faster for bigger differences

    if (Math.abs(diff) > 0.1) {
      valueRef.current += Math.sign(diff) * Math.min(speed, Math.abs(diff))
      setAnimatedValue(valueRef.current)
    }

    requestRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = sizeConfig
    const centerX = width / 2
    const centerY = height / 2
    const outerRadius = Math.min(centerX, centerY) - 10
    const innerRadius = outerRadius - 40

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height)

    // Draw dark background circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI)
    ctx.fillStyle = "#1a1f36"
    ctx.fill()

    // Draw outer ring
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI)
    ctx.strokeStyle = "#2d3748"
    ctx.lineWidth = 2
    ctx.stroke()

    // Calculate start and end angles (start from bottom, go 270 degrees counter-clockwise)
    const startAngle = Math.PI / 2 + Math.PI // 270 degrees (bottom)
    const endAngle = startAngle + (Math.PI * 3) / 2 // 270 degrees counter-clockwise

    // Draw scale marks
    const totalMarks = 10
    const majorMarks = [0, 5, 10, 50, 100, 250, 500, 750, 1000]

    for (let i = 0; i <= totalMarks; i++) {
      const angle = startAngle + ((endAngle - startAngle) * i) / totalMarks
      const markValue = (maxValue * i) / totalMarks

      // Draw mark line
      const innerMarkRadius = innerRadius + 5
      const outerMarkRadius = outerRadius - 5

      const x1 = centerX + innerMarkRadius * Math.cos(angle)
      const y1 = centerY + innerMarkRadius * Math.sin(angle)
      const x2 = centerX + outerMarkRadius * Math.cos(angle)
      const y2 = centerY + outerMarkRadius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = "#4a5568"
      ctx.lineWidth = 2
      ctx.stroke()

      // Add labels for major marks
      if (majorMarks.includes(Math.round(markValue))) {
        const textRadius = outerRadius + 15
        const textX = centerX + textRadius * Math.cos(angle)
        const textY = centerY + textRadius * Math.sin(angle)

        ctx.fillStyle = "#a0aec0"
        ctx.font = `${sizeConfig.labelSize}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(markValue.toString(), textX, textY)
      }
    }

    // Calculate percentage and angle for current value
    const percentage = Math.min(animatedValue / maxValue, 1)
    const valueAngle = startAngle + (endAngle - startAngle) * percentage

    // Draw colored arc for current value
    const gradient = ctx.createLinearGradient(centerX - outerRadius, centerY, centerX + outerRadius, centerY)

    if (color === "download") {
      gradient.addColorStop(0, "#0bc5ea")
      gradient.addColorStop(1, "#00b5d8")
    } else if (color === "upload") {
      gradient.addColorStop(0, "#805ad5")
      gradient.addColorStop(1, "#6b46c1")
    } else {
      gradient.addColorStop(0, "#ecc94b")
      gradient.addColorStop(1, "#d69e2e")
    }

    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius + 20, startAngle, valueAngle)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 30
    ctx.lineCap = "round"
    ctx.stroke()

    // Add glow effect if active
    if (isActive) {
      ctx.save()
      ctx.shadowColor = getGlowColor(color)
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius + 20, startAngle, valueAngle)
      ctx.strokeStyle = gradient
      ctx.lineWidth = 30
      ctx.lineCap = "round"
      ctx.stroke()
      ctx.restore()
    }

    // Draw inner circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius - 10, 0, 2 * Math.PI)
    ctx.fillStyle = "#151a30"
    ctx.fill()
  }, [animatedValue, maxValue, color, isActive, sizeConfig])

  const getGlowColor = (colorType: string) => {
    switch (colorType) {
      case "download":
        return "#0bc5ea"
      case "upload":
        return "#805ad5"
      case "ping":
        return "#ecc94b"
      default:
        return "#a0aec0"
    }
  }

  const getTextColor = (colorType: string) => {
    switch (colorType) {
      case "download":
        return "text-cyan-400"
      case "upload":
        return "text-purple-400"
      case "ping":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  const getLabel = (colorType: string) => {
    switch (colorType) {
      case "download":
        return "DOWNLOAD"
      case "upload":
        return "UPLOAD"
      case "ping":
        return "PING"
      default:
        return ""
    }
  }

  const displayValue = animatedValue.toFixed(2)
  const textColorClass = getTextColor(color)

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={sizeConfig.width} height={sizeConfig.height} className="w-full h-auto" />

      {/* Center display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-5xl font-bold ${textColorClass} transition-all duration-300`}>{displayValue}</div>
        <div className="text-gray-400 font-medium mt-1">{unit}</div>
        {showLabel && <div className="text-gray-500 text-sm mt-2 font-medium tracking-wider">{getLabel(color)}</div>}
      </div>
    </div>
  )
}
