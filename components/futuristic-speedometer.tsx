"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface FuturisticSpeedometerProps {
  value: number
  maxValue: number
  label: string
  color: "primary" | "secondary" | "accent"
  isActive?: boolean
  unit: string
}

export default function FuturisticSpeedometer({
  value,
  maxValue,
  label,
  color,
  isActive = false,
  unit,
}: FuturisticSpeedometerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animatedValue, setAnimatedValue] = useState(0)
  const [particles, setParticles] = useState<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  // Particle system for active state
  useEffect(() => {
    if (!isActive) {
      setParticles([])
      return
    }

    const interval = setInterval(() => {
      setParticles((prev) => {
        const newParticles = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0)

        // Add new particles
        if (newParticles.length < 20) {
          for (let i = 0; i < 3; i++) {
            newParticles.push({
              x: 200 + Math.random() * 100 - 50,
              y: 200 + Math.random() * 100 - 50,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 1,
            })
          }
        }

        return newParticles
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isActive])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = 400
    const height = 400
    const centerX = width / 2
    const centerY = height / 2
    const radius = 150

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Create gradient backgrounds
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius + 50)
    bgGradient.addColorStop(0, "rgba(15, 23, 42, 0.8)")
    bgGradient.addColorStop(1, "rgba(15, 23, 42, 0.2)")

    // Draw background circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 30, 0, 2 * Math.PI)
    ctx.fillStyle = bgGradient
    ctx.fill()

    // Draw outer ring with glow
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI)
    ctx.strokeStyle = getColorScheme(color).ring
    ctx.lineWidth = 2
    ctx.shadowColor = getColorScheme(color).glow
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.shadowBlur = 0

    // Draw scale marks with 3D effect
    const totalMarks = 12
    for (let i = 0; i <= totalMarks; i++) {
      const angle = (Math.PI * 2 * i) / totalMarks - Math.PI / 2
      const markValue = (maxValue * i) / totalMarks

      // 3D mark effect
      const innerRadius = radius - 10
      const outerRadius = radius + 5

      const x1 = centerX + innerRadius * Math.cos(angle)
      const y1 = centerY + innerRadius * Math.sin(angle)
      const x2 = centerX + outerRadius * Math.cos(angle)
      const y2 = centerY + outerRadius * Math.sin(angle)

      // Shadow
      ctx.beginPath()
      ctx.moveTo(x1 + 2, y1 + 2)
      ctx.lineTo(x2 + 2, y2 + 2)
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
      ctx.lineWidth = 4
      ctx.stroke()

      // Main mark
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = i % 3 === 0 ? getColorScheme(color).primary : getColorScheme(color).secondary
      ctx.lineWidth = i % 3 === 0 ? 4 : 2
      ctx.stroke()

      // Numbers for major marks
      if (i % 3 === 0) {
        const textRadius = radius + 25
        const textX = centerX + textRadius * Math.cos(angle)
        const textY = centerY + textRadius * Math.sin(angle)

        ctx.fillStyle = getColorScheme(color).text
        ctx.font = "bold 14px 'Courier New', monospace"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(markValue.toFixed(0), textX, textY)
      }
    }

    // Draw value arc with animated glow
    const percentage = Math.min(animatedValue / maxValue, 1)
    const endAngle = -Math.PI / 2 + Math.PI * 2 * percentage

    // Multiple glow layers for depth
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - 5, -Math.PI / 2, endAngle)
      ctx.strokeStyle = getColorScheme(color).glow
      ctx.lineWidth = 15 - i * 3
      ctx.lineCap = "round"
      ctx.globalAlpha = 0.3 - i * 0.1
      ctx.stroke()
    }

    ctx.globalAlpha = 1

    // Main value arc
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 5, -Math.PI / 2, endAngle)
    ctx.strokeStyle = getColorScheme(color).primary
    ctx.lineWidth = 8
    ctx.lineCap = "round"
    ctx.stroke()

    // Draw particles
    particles.forEach((particle) => {
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI)
      ctx.fillStyle = `${getColorScheme(color).primary}${Math.floor(particle.life * 255)
        .toString(16)
        .padStart(2, "0")}`
      ctx.fill()
    })

    // Draw center hub with 3D effect
    const hubGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25)
    hubGradient.addColorStop(0, getColorScheme(color).hub)
    hubGradient.addColorStop(1, "rgba(15, 23, 42, 0.9)")

    ctx.beginPath()
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI)
    ctx.fillStyle = hubGradient
    ctx.fill()

    // Hub border
    ctx.beginPath()
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI)
    ctx.strokeStyle = getColorScheme(color).ring
    ctx.lineWidth = 2
    ctx.stroke()
  }, [animatedValue, maxValue, color, particles])

  const getColorScheme = (colorType: string) => {
    switch (colorType) {
      case "primary":
        return {
          primary: "#00f5ff",
          secondary: "#0891b2",
          glow: "#00f5ff",
          ring: "#164e63",
          text: "#67e8f9",
          hub: "#0e7490",
        }
      case "secondary":
        return {
          primary: "#a855f7",
          secondary: "#7c3aed",
          glow: "#a855f7",
          ring: "#581c87",
          text: "#c4b5fd",
          hub: "#7c3aed",
        }
      case "accent":
        return {
          primary: "#f59e0b",
          secondary: "#d97706",
          glow: "#f59e0b",
          ring: "#92400e",
          text: "#fbbf24",
          hub: "#d97706",
        }
      default:
        return {
          primary: "#00f5ff",
          secondary: "#0891b2",
          glow: "#00f5ff",
          ring: "#164e63",
          text: "#67e8f9",
          hub: "#0e7490",
        }
    }
  }

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={400} height={400} className="w-full h-auto max-w-sm" />

      {/* Center display with holographic effect */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          animate={{
            scale: isActive ? [1, 1.05, 1] : 1,
            textShadow: isActive
              ? ["0 0 10px #00f5ff", "0 0 20px #00f5ff, 0 0 30px #00f5ff", "0 0 10px #00f5ff"]
              : "0 0 5px #00f5ff",
          }}
          transition={{ duration: 2, repeat: isActive ? Number.POSITIVE_INFINITY : 0 }}
          className="text-6xl font-bold text-cyan-400 font-futuristic tracking-wider"
          style={{
            textShadow: "0 0 10px #00f5ff, 0 0 20px #00f5ff",
            fontFamily: "'Courier New', monospace",
          }}
        >
          {animatedValue.toFixed(2)}
        </motion.div>
        <div className="text-cyan-300 text-lg font-medium mt-1 tracking-widest font-futuristic">{unit}</div>
        <div className="text-cyan-500 text-sm mt-2 uppercase tracking-[0.2em] font-futuristic">{label}</div>
      </div>

      {/* Holographic overlay effect */}
      {isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              "radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.1) 0%, transparent 70%)",
              "radial-gradient(circle at 60% 40%, rgba(0, 245, 255, 0.15) 0%, transparent 70%)",
              "radial-gradient(circle at 40% 60%, rgba(0, 245, 255, 0.1) 0%, transparent 70%)",
            ],
          }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        />
      )}
    </div>
  )
}
