"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Globe, Zap, Gauge } from "lucide-react"

interface TestMethodSelectorProps {
  selectedMethod: "cloudflare" | "network-speed" | "fast"
  onMethodChange: (method: "cloudflare" | "network-speed" | "fast") => void
  disabled?: boolean
}

export default function TestMethodSelector({
  selectedMethod,
  onMethodChange,
  disabled = false,
}: TestMethodSelectorProps) {
  const methods = [
    {
      value: "cloudflare",
      label: "Cloudflare",
      description: "Most accurate, uses Cloudflare's network (with fallback)",
      icon: <Globe className="w-4 h-4" />,
      badge: "Recommended",
    },
    {
      value: "network-speed",
      label: "Network Speed",
      description: "Reliable testing with multiple endpoints",
      icon: <Gauge className="w-4 h-4" />,
      badge: "Reliable",
    },
    {
      value: "fast",
      label: "Fast.com",
      description: "Netflix's speed test (with smart fallback)",
      icon: <Zap className="w-4 h-4" />,
      badge: "Popular",
    },
  ]

  const selectedMethodInfo = methods.find((m) => m.value === selectedMethod)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Test Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedMethod} onValueChange={onMethodChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {methods.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                <div className="flex items-center gap-2">
                  {method.icon}
                  <span>{method.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {method.badge}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedMethodInfo && <div className="text-xs text-muted-foreground">{selectedMethodInfo.description}</div>}
      </CardContent>
    </Card>
  )
}
