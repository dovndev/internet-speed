"use client"

import { User, Globe } from "lucide-react"

interface IspInfoDisplayProps {
  ispName?: string
  ipAddress?: string
  location?: string
  serverInfo?: string
}

export default function IspInfoDisplay({
  ispName = "—",
  ipAddress = "—",
  location = "—",
  serverInfo = "—",
}: IspInfoDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-6 w-full max-w-3xl mx-auto mt-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
          <User className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <div className="text-gray-300 font-medium text-lg">{ispName}</div>
          <div className="text-gray-500 text-sm">{ipAddress}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
          <Globe className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <div className="text-gray-300 font-medium text-lg">{location}</div>
          <div className="text-gray-500 text-sm">{serverInfo}</div>
        </div>
      </div>
    </div>
  )
}
