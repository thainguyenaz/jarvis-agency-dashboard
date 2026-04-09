'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function CensusPage() {
  const [census, setCensus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    api.getCensus(t).then(setCensus).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-jarvis-cyan font-mono animate-pulse">LOADING CENSUS DATA...</div>
  if (!census) return <div className="text-jarvis-red font-mono">Census data unavailable</div>

  const locations = census.byLocation || census.locations || census.facilities || []
  const totalCensus = census.totalCensus || census.total_patients || 0
  const totalBeds = 20
  const occupancyPct = Math.round((totalCensus / totalBeds) * 100)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">KIPU CENSUS — BED BOARD</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className={`bg-jarvis-surface border rounded-lg p-6 ${
          occupancyPct < 50 ? 'border-jarvis-red' :
          occupancyPct < 70 ? 'border-jarvis-yellow' :
          'border-jarvis-green'
        }`}>
          <div className="text-xs font-mono text-jarvis-dim mb-1">OVERALL OCCUPANCY</div>
          <div className={`text-5xl font-bold font-mono ${
            occupancyPct < 50 ? 'text-jarvis-red' :
            occupancyPct < 70 ? 'text-jarvis-yellow' :
            'text-jarvis-green'
          }`}>{occupancyPct}%</div>
          <div className="text-jarvis-dim text-xs font-mono mt-2">{totalCensus}/{totalBeds} beds occupied</div>
        </div>
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-6">
          <div className="text-xs font-mono text-jarvis-dim mb-1">AVAILABLE BEDS</div>
          <div className="text-5xl font-bold font-mono text-jarvis-cyan">{totalBeds - totalCensus}</div>
          <div className="text-jarvis-dim text-xs font-mono mt-2">across all locations</div>
        </div>
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-6">
          <div className="text-xs font-mono text-jarvis-dim mb-1">TOTAL CAPACITY</div>
          <div className="text-5xl font-bold font-mono text-jarvis-cyan">{totalBeds}</div>
          <div className="text-jarvis-dim text-xs font-mono mt-2">Glendale + Scottsdale</div>
        </div>
      </div>

      {locations.length > 0 && (
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
          <h2 className="text-jarvis-cyan font-mono font-bold mb-4 tracking-wider">BY LOCATION</h2>
          <div className="space-y-4">
            {locations.map((loc: any, i: number) => {
              const occupied = loc.census || loc.patients || loc.occupied || 0
              const capacity = loc.capacity || loc.beds || 10
              const pct = Math.round((occupied / capacity) * 100)
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm text-jarvis-text">
                      {loc.name || loc.facility || `Location ${i+1}`}
                    </div>
                    <div className={`font-mono text-sm font-bold ${
                      pct < 50 ? 'text-jarvis-red' :
                      pct < 70 ? 'text-jarvis-yellow' :
                      'text-jarvis-green'
                    }`}>{occupied}/{capacity} ({pct}%)</div>
                  </div>
                  <div className="w-full bg-jarvis-bg rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        pct < 50 ? 'bg-jarvis-red' :
                        pct < 70 ? 'bg-jarvis-yellow' :
                        'bg-jarvis-green'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
