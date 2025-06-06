"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface HolographicDisplayProps {
  title: string
  value: string
  unit: string
  subtitle?: string
  isActive?: boolean
  color?: "cyan" | "purple" | "amber" | "emerald"
  size?: "sm" | "md" | "lg"
}

export default function HolographicDisplay({
  title,
  value,
  unit,
  subtitle,
  isActive = false,
  color = "cyan",
  size = "md",
}: HolographicDisplayProps) {
  const [scanLine, setScanLine] = useState(0)

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setScanLine((prev) => (prev + 1) % 100)
    }, 50)

    return () => clearInterval(interval)
  }, [isActive])

  const colorSchemes = {
    cyan: {
      primary: "#00f5ff",
      secondary: "#0891b2",
      glow: "0 0 20px #00f5ff, 0 0 40px #00f5ff",
      bg: "rgba(0, 245, 255, 0.05)",
      border: "rgba(0, 245, 255, 0.3)",
    },
    purple: {
      primary: "#a855f7",
      secondary: "#7c3aed",
      glow: "0 0 20px #a855f7, 0 0 40px #a855f7",
      bg: "rgba(168, 85, 247, 0.05)",
      border: "rgba(168, 85, 247, 0.3)",
    },
    amber: {
      primary: "#f59e0b",
      secondary: "#d97706",
      glow: "0 0 20px #f59e0b, 0 0 40px #f59e0b",
      bg: "rgba(245, 158, 11, 0.05)",
      border: "rgba(245, 158, 11, 0.3)",
    },
    emerald: {
      primary: "#10b981",
      secondary: "#059669",
      glow: "0 0 20px #10b981, 0 0 40px #10b981",
      bg: "rgba(16, 185, 129, 0.05)",
      border: "rgba(16, 185, 129, 0.3)",
    },
  }

  const scheme = colorSchemes[color]
  const sizeClasses = {
    sm: "p-4 text-2xl",
    md: "p-6 text-4xl",
    lg: "p-8 text-6xl",
  }

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} rounded-lg backdrop-blur-sm overflow-hidden`}
      style={{
        background: scheme.bg,
        border: `1px solid ${scheme.border}`,
        boxShadow: isActive ? scheme.glow : `0 0 10px ${scheme.primary}`,
      }}
      animate={{
        scale: isActive ? [1, 1.02, 1] : 1,
      }}
      transition={{ duration: 2, repeat: isActive ? Number.POSITIVE_INFINITY : 0 }}
    >
      {/* Holographic grid overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(${scheme.primary} 1px, transparent 1px),
            linear-gradient(90deg, ${scheme.primary} 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Scanning line effect */}
      {isActive && (
        <motion.div
          className="absolute inset-x-0 h-0.5 opacity-60"
          style={{
            background: `linear-gradient(90deg, transparent, ${scheme.primary}, transparent)`,
            top: `${scanLine}%`,
          }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 text-center">
        <div
          className="text-sm font-medium tracking-widest uppercase mb-2 font-futuristic"
          style={{ color: scheme.secondary }}
        >
          {title}
        </div>

        <motion.div
          className="font-display font-bold tracking-wider"
          style={{
            color: scheme.primary,
            textShadow: isActive ? scheme.glow : `0 0 10px ${scheme.primary}`,
            fontFamily: "'Courier New', monospace",
          }}
          animate={{
            textShadow: isActive
              ? [
                  `0 0 10px ${scheme.primary}`,
                  `0 0 20px ${scheme.primary}, 0 0 30px ${scheme.primary}`,
                  `0 0 10px ${scheme.primary}`,
                ]
              : `0 0 10px ${scheme.primary}`,
          }}
          transition={{ duration: 1.5, repeat: isActive ? Number.POSITIVE_INFINITY : 0 }}
        >
          {value}
          <span className="text-lg ml-2 font-futuristic" style={{ color: scheme.secondary }}>
            {unit}
          </span>
        </motion.div>

        {subtitle && (
          <div className="text-xs mt-2 tracking-wide font-futuristic" style={{ color: scheme.secondary }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2" style={{ borderColor: scheme.primary }} />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2" style={{ borderColor: scheme.primary }} />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2" style={{ borderColor: scheme.primary }} />
      <div
        className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2"
        style={{ borderColor: scheme.primary }}
      />
    </motion.div>
  )
}
