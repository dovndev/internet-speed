"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi } from "lucide-react"

interface PingResult {
  timestamp: number
  ping: number
  status: "success" | "error"
}

export default function LivePingMonitor() {
  const [isActive, setIsActive] = useState(false)
  const [pingResults, setPingResults] = useState<PingResult[]>([])
  const [currentPing, setCurrentPing] = useState<number | null>(null)
  const [jitter, setJitter] = useState<number | null>(null)
  const [packetLoss, setPacketLoss] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const pingEndpoints = [
    "https://www.google.com/favicon.ico",
    "https://www.cloudflare.com/favicon.ico",
    "https://httpbin.org/get",
  ]
  const endpointIndex = useRef(0)

  const startMonitoring = () => {
    if (intervalRef.current) return
    setIsActive(true)

    // Clear previous results
    setPingResults([])
    setCurrentPing(null)
    setJitter(null)
    setPacketLoss(0)

    // Start continuous ping
    intervalRef.current = setInterval(measurePing, 1000)
    measurePing() // Run immediately
  }

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsActive(false)
  }

  const measurePing = async () => {
    const endpoint = pingEndpoints[endpointIndex.current % pingEndpoints.length]
    endpointIndex.current = (endpointIndex.current + 1) % pingEndpoints.length

    const timestamp = Date.now()
    try {
      const start = performance.now()

      await fetch(endpoint, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-cache",
      })

      const end = performance.now()
      const pingTime = end - start

      setPingResults((prev) => {
        // Keep only the last 30 results
        const newResults = [...prev, { timestamp, ping: pingTime, status: "success" }]
        if (newResults.length > 30) {
          return newResults.slice(newResults.length - 30)
        }
        return newResults
      })

      setCurrentPing(pingTime)

      // Calculate jitter if we have at least 2 successful pings
      const successfulPings = [...pingResults, { timestamp, ping: pingTime, status: "success" }].filter(
        (r) => r.status === "success",
      )

      if (successfulPings.length >= 2) {
        const pingDifferences = successfulPings
          .slice(1)
          .map((result, i) => Math.abs(result.ping - successfulPings[i].ping))

        const avgJitter = pingDifferences.reduce((sum, diff) => sum + diff, 0) / pingDifferences.length
        setJitter(avgJitter)
      }

      // Update packet loss
      const totalAttempts = pingResults.length + 1
      const failures = pingResults.filter((r) => r.status === "error").length
      setPacketLoss((failures / totalAttempts) * 100)
    } catch (error) {
      console.warn("Ping failed:", error)
      setPingResults((prev) => {
        const newResults = [...prev, { timestamp, ping: 0, status: "error" }]
        if (newResults.length > 30) {
          return newResults.slice(newResults.length - 30)
        }
        return newResults
      })

      // Update packet loss
      const totalAttempts = pingResults.length + 1
      const failures = pingResults.filter((r) => r.status === "error").length + 1
      setPacketLoss((failures / totalAttempts) * 100)
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const getPingQuality = (ping: number | null) => {
    if (ping === null) return { label: "Unknown", color: "bg-gray-100 text-gray-800" }
    if (ping < 20) return { label: "Excellent", color: "bg-green-100 text-green-800" }
    if (ping < 50) return { label: "Good", color: "bg-blue-100 text-blue-800" }
    if (ping < 100) return { label: "Fair", color: "bg-yellow-100 text-yellow-800" }
    return { label: "Poor", color: "bg-red-100 text-red-800" }
  }

  const pingQuality = getPingQuality(currentPing)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Live Ping Monitor
          </div>
          <Badge className={pingQuality.color}>{pingQuality.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Ping</div>
            <div className="text-2xl font-bold">{currentPing !== null ? `${currentPing.toFixed(1)} ms` : "—"}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Jitter</div>
            <div className="text-2xl font-bold">{jitter !== null ? `${jitter.toFixed(1)} ms` : "—"}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Packet Loss</div>
            <div className="text-2xl font-bold">{packetLoss.toFixed(1)}%</div>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {!isActive ? (
            <button
              onClick={startMonitoring}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Monitoring
            </button>
          ) : (
            <button
              onClick={stopMonitoring}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Stop Monitoring
            </button>
          )}
        </div>

        {pingResults.length > 0 && (
          <div className="h-20 relative">
            <div className="absolute inset-0 flex items-end">
              {pingResults.map((result, index) => {
                const height = result.status === "error" ? 0 : Math.min((result.ping / 200) * 100, 100)
                const color = result.status === "error" ? "bg-red-500" : "bg-blue-500"
                return (
                  <div
                    key={index}
                    className="flex-1 mx-0.5 rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${height}%`,
                      backgroundColor: result.status === "error" ? "#ef4444" : "#3b82f6",
                    }}
                    title={`${result.ping.toFixed(1)} ms`}
                  />
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
