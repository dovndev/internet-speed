"use client"

import { useEffect, useState } from "react"

interface SpeedGaugeProps {
  value: number
  maxValue: number
  color: string
  label: string
  theme: "default" | "neon" | "minimal"
}

export default function SpeedGauge({ value, maxValue, color, label, theme }: SpeedGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  const percentage = Math.min((animatedValue / maxValue) * 100, 100)
  const strokeDasharray = 2 * Math.PI * 45
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100

  const getColorClass = (color: string, theme: string) => {
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

  const strokeColor = getColorClass(color, theme)

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle cx="50" cy="50" r="45" fill="none" stroke={theme === "neon" ? "#001122" : "#e5e7eb"} strokeWidth="6" />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: theme === "neon" ? `drop-shadow(0 0 8px ${strokeColor})` : "none",
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-lg font-bold ${theme === "neon" ? "text-white" : "text-gray-900"}`}>
          {percentage.toFixed(0)}%
        </div>
        <div className={`text-xs text-center ${theme === "neon" ? "text-gray-300" : "text-gray-500"}`}>{label}</div>
      </div>
    </div>
  )
}
