"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { SpeedUnit } from "@/lib/speed-test-libraries"

interface UnitSelectorProps {
  selectedUnit: SpeedUnit
  onUnitChange: (unit: SpeedUnit) => void
  disabled?: boolean
}

export default function UnitSelector({ selectedUnit, onUnitChange, disabled = false }: UnitSelectorProps) {
  const bitUnits = [
    { value: "Mbps", label: "Mbps (Megabits/s)" },
    { value: "Kbps", label: "Kbps (Kilobits/s)" },
  ]

  const byteUnits = [
    { value: "MBps", label: "MB/s (Megabytes/s)" },
    { value: "KBps", label: "KB/s (Kilobytes/s)" },
    { value: "Bps", label: "B/s (Bytes/s)" },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Speed Units</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Bit-based Units</h4>
            <RadioGroup
              value={selectedUnit}
              onValueChange={(value) => onUnitChange(value as SpeedUnit)}
              disabled={disabled}
              className="flex flex-col space-y-1"
            >
              {bitUnits.map((unit) => (
                <div key={unit.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={unit.value} id={`unit-${unit.value}`} />
                  <Label htmlFor={`unit-${unit.value}`} className="text-sm">
                    {unit.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Byte-based Units</h4>
            <RadioGroup
              value={selectedUnit}
              onValueChange={(value) => onUnitChange(value as SpeedUnit)}
              disabled={disabled}
              className="flex flex-col space-y-1"
            >
              {byteUnits.map((unit) => (
                <div key={unit.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={unit.value} id={`unit-${unit.value}`} />
                  <Label htmlFor={`unit-${unit.value}`} className="text-sm">
                    {unit.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
