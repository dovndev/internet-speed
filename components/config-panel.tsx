"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Gauge, LineChart } from "lucide-react"
import UnitSelector from "@/components/unit-selector"
import type { SpeedUnit } from "@/lib/speed-test-libraries"

interface DisplayConfig {
  showDownload: boolean
  showUpload: boolean
  showPing: boolean
  showJitter: boolean
  showPacketLoss: boolean
  displayFormat: "gauge" | "progress" | "numeric" | "card"
  meterTheme: "default" | "neon" | "minimal" | "gauge"
  meterSize: "sm" | "md" | "lg"
  showLiveGraphs: boolean
}

interface ConfigPanelProps {
  config: DisplayConfig
  onConfigChange: (config: DisplayConfig) => void
  speedUnit: SpeedUnit
  onSpeedUnitChange: (unit: SpeedUnit) => void
}

export default function ConfigPanel({ config, onConfigChange, speedUnit, onSpeedUnitChange }: ConfigPanelProps) {
  const updateConfig = (key: keyof DisplayConfig, value: any) => {
    onConfigChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Display Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-medium">Metrics to Display</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="download"
                    checked={config.showDownload}
                    onCheckedChange={(checked) => updateConfig("showDownload", checked)}
                  />
                  <Label htmlFor="download">Download Speed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="upload"
                    checked={config.showUpload}
                    onCheckedChange={(checked) => updateConfig("showUpload", checked)}
                  />
                  <Label htmlFor="upload">Upload Speed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ping"
                    checked={config.showPing}
                    onCheckedChange={(checked) => updateConfig("showPing", checked)}
                  />
                  <Label htmlFor="ping">Ping Latency</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="jitter"
                    checked={config.showJitter}
                    onCheckedChange={(checked) => updateConfig("showJitter", checked)}
                  />
                  <Label htmlFor="jitter">Jitter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="packetLoss"
                    checked={config.showPacketLoss}
                    onCheckedChange={(checked) => updateConfig("showPacketLoss", checked)}
                  />
                  <Label htmlFor="packetLoss">Packet Loss</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="liveGraphs"
                    checked={config.showLiveGraphs}
                    onCheckedChange={(checked) => updateConfig("showLiveGraphs", checked)}
                  />
                  <Label htmlFor="liveGraphs">Live Graphs</Label>
                </div>
              </div>
            </div>

            <UnitSelector selectedUnit={speedUnit} onUnitChange={onSpeedUnitChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Meter Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Meter Theme</h4>
              <Select value={config.meterTheme} onValueChange={(value) => updateConfig("meterTheme", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="neon">Neon</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="gauge">Gauge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="font-medium mb-2">Meter Size</h4>
              <Select value={config.meterSize} onValueChange={(value) => updateConfig("meterSize", value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Real-Time Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="showLiveGraphs"
                checked={config.showLiveGraphs}
                onCheckedChange={(checked) => updateConfig("showLiveGraphs", checked)}
              />
              <Label htmlFor="showLiveGraphs">Show Live Graphs</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Live graphs show real-time measurements during the speed test, providing more detailed insights into your
              connection's performance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
