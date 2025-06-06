"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Cloud, Gauge, Activity, Shield } from "lucide-react"
import type { SpeedTestLibrary } from "@/lib/speed-test-libraries"

interface LibrarySelectorProps {
  selectedLibrary: SpeedTestLibrary
  onLibraryChange: (library: SpeedTestLibrary) => void
  disabled?: boolean
}

export default function LibrarySelector({ selectedLibrary, onLibraryChange, disabled = false }: LibrarySelectorProps) {
  const libraries = [
    {
      value: "ng-speed-test",
      label: "NG Speed Test",
      description: "Multiple iterations with averaging for consistent results",
      icon: <Activity className="w-4 h-4" />,
      badge: "Recommended",
    },
    {
      value: "network-speed",
      label: "Network Speed",
      description: "Basic speed testing with custom endpoints",
      icon: <Gauge className="w-4 h-4" />,
      badge: "Reliable",
    },
    {
      value: "cloudflare",
      label: "Cloudflare SpeedTest",
      description: "Uses Cloudflare's global edge network (may have CORS issues)",
      icon: <Cloud className="w-4 h-4" />,
      badge: "Advanced",
    },
    {
      value: "fallback",
      label: "Fallback Method",
      description: "Most compatible method that works in all environments",
      icon: <Shield className="w-4 h-4" />,
      badge: "Compatible",
    },
  ]

  const selectedLibraryInfo = libraries.find((lib) => lib.value === selectedLibrary)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Speed Test Library</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select
          value={selectedLibrary}
          onValueChange={(value) => onLibraryChange(value as SpeedTestLibrary)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {libraries.map((library) => (
              <SelectItem key={library.value} value={library.value}>
                <div className="flex items-center gap-2">
                  {library.icon}
                  <span>{library.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {library.badge}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedLibraryInfo && <div className="text-xs text-muted-foreground">{selectedLibraryInfo.description}</div>}
      </CardContent>
    </Card>
  )
}
