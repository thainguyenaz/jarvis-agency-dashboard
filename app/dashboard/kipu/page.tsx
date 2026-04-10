'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const RTC_BEDS = 10
const TEST_PATTERNS = ['zzz', 'roger rabbit', 'test', 'billing']

function isTest(p: any): boolean {
  const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase()
  return TEST_PATTERNS.some(t => name.includes(t))
}

function pct(occupied: number, capacity: number): number {
  return capacity > 0 ? Math.round((occupied / capacity) * 100) : 0
}

function OccupancyBar({ value, max }: { value: number; max: number }) {
  const p = pct(value, max)
  return (
    <div className="w-full bg-jarvis-bg rounded-full h-3">
      <div
        className={`h-3 rounded-full transition-all ${
          p >= 80 ? 'bg-jarvis-green' :
          p >= 50 ? 'bg-jarvis-yellow' :
          'bg-jarvis-red'
        }`}
        style={{ width: `${Math.min(p, 100)}%` }}
      />
    </div>
  )
}

function statusColor(p: number): string {
  if (p >= 80) return 'text-jarvis-green'
  if (p >= 60) return 'text-jarvis-yellow'
  return 'text-jarvis-red'
}

function borderColor(p: number): string {
  if (p >= 80) return 'border-jarvis-green'
  if (p >= 60) return 'border-jarvis-yellow'
  return 'border-jarvis-red'
}

export default function CensusPage() {
  const [census, setCensus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    api.getCensus(t)
      .then(d => { setCensus(d); setUpdatedAt(new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-jarvis-cyan font-mono animate-pulse">
      LOADING CENSUS DATA...
    </div>
  )
  if (!census) return (
    <div className="bg-jarvis-surface border border-jarvis-red border-opacity-30 rounded-lg p-8 text-center">
      <div className="text-jarvis-red font-mono font-bold mb-2">DATA UNAVAILABLE</div>
      <div className="text-jarvis-dim text-xs font-mono">
        Check VPS connection ·
        <button onClick={() => window.location.reload()} className="text-jarvis-cyan ml-1 hover:underline">Retry</button>
      </div>
    </div>
  )

  // Filter test patients
  const allPatients: any[] = (census.patients || []).filter((p: any) => !isTest(p))

  // RTC patients (Church + Frier)
  const rtcPatients = allPatients.filter((p: any) =>
    ['church', 'frier'].some(f => (p.location || '').toLowerCase().includes(f))
  )

  // Outpatient patients (Indian School)
  const outpatientPatients = allPatients.filter((p: any) =>
    (p.location || '').toLowerCase().includes('indian')
  )

  // PHP/IOP/OP/TMS counts from program field
  function countProgram(keyword: string): number {
    return outpatientPatients.filter((p: any) =>
      (p.program || '').toLowerCase().includes(keyword.toLowerCase())
    ).length
  }

  const phpCount = countProgram('php') || outpatientPatients.filter((p: any) =>
    (p.program || '').toLowerCase().includes('partial')
  ).length
  const iopCount = countProgram('iop') || countProgram('intensive')
  const opCount = countProgram(' op') || countProgram('outpatient')
  const tmsCount = countProgram('tms') || countProgram('neurostar')

  // If program field doesn't differentiate, show total outpatient as PHP
  const phpDisplay = phpCount || (iopCount === 0 && opCount === 0 ? outpatientPatients.length : phpCount)

  // Use confirmed direct fields from API
  const churchCount = census.church || rtcPatients.filter((p: any) => (p.location || '').toLowerCase().includes('church')).length
  const frierCount = census.frier || rtcPatients.filter((p: any) => (p.location || '').toLowerCase().includes('frier')).length

  const rtcTotal = churchCount + frierCount
  const rtcCapacity = 20
  const rtcPct = census.occupancyPct || pct(rtcTotal, rtcCapacity)

  // Location details from locations array
  const locations: any[] = census.locations || []
  const indianSchool = locations.find((l: any) => l.name?.toLowerCase().includes('indian'))
  const moody = locations.find((l: any) => l.name?.toLowerCase().includes('moody'))
  const churchPct = pct(churchCount, RTC_BEDS)
  const frierPct = pct(frierCount, RTC_BEDS)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">
          KIPU CENSUS — BED BOARD
        </h1>
        <div className="text-jarvis-dim text-xs font-mono">
          {updatedAt} MST
          <span className="ml-2 opacity-50">
            {census.cached ? '● cached' : '● live'} · {census.source}
          </span>
        </div>
      </div>

      {/* RTC OVERALL */}
      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-5">
        <div className="text-jarvis-cyan font-mono font-bold text-sm tracking-wider mb-4">
          🏥 RESIDENTIAL TREATMENT CENTERS (RTC)
        </div>

        {/* RTC Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className={`border rounded-lg p-4 ${borderColor(rtcPct)}`}>
            <div className="text-xs font-mono text-jarvis-dim mb-1">TOTAL RTC OCCUPANCY</div>
            <div className={`text-4xl font-bold font-mono ${statusColor(rtcPct)}`}>
              {rtcPct}%
            </div>
            <div className="text-jarvis-dim text-xs font-mono mt-1">
              {rtcTotal}/{rtcCapacity} beds
            </div>
            {rtcPct === 100 && (
              <div className="text-jarvis-green text-xs font-mono mt-2 font-bold">
                FULL CAPACITY
              </div>
            )}
          </div>
          <div className="border border-jarvis-border rounded-lg p-4">
            <div className="text-xs font-mono text-jarvis-dim mb-1">AVAILABLE BEDS</div>
            <div className="text-4xl font-bold font-mono text-jarvis-cyan">
              {rtcCapacity - rtcTotal}
            </div>
            <div className="text-jarvis-dim text-xs font-mono mt-1">across both facilities</div>
          </div>
          <div className="border border-jarvis-border rounded-lg p-4">
            <div className="text-xs font-mono text-jarvis-dim mb-1">TOTAL CAPACITY</div>
            <div className="text-4xl font-bold font-mono text-jarvis-cyan">20</div>
            <div className="text-jarvis-dim text-xs font-mono mt-1">Frier + Church · 10 beds each</div>
          </div>
        </div>

        {/* Individual RTC facilities */}
        <div className="grid grid-cols-2 gap-4">
          {/* CHURCH */}
          <div className={`border rounded-lg p-4 ${borderColor(churchPct)}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="font-mono font-bold text-jarvis-text">CHURCH (RTC)</div>
              <div className={`font-mono font-bold text-xl ${statusColor(churchPct)}`}>
                {churchPct}%
              </div>
            </div>
            <div className="text-jarvis-dim text-xs font-mono mb-3">
              Scottsdale · Female Residential · 23222 N Church Rd
            </div>
            <OccupancyBar value={churchCount} max={RTC_BEDS} />
            <div className="flex justify-between text-xs font-mono text-jarvis-dim mt-2">
              <span>{churchCount}/{RTC_BEDS} beds occupied</span>
              <span>{RTC_BEDS - churchCount} open</span>
            </div>
            {churchPct >= 90 && (
              <div className="text-jarvis-green text-xs font-mono mt-2 font-bold">
                AT CAPACITY — WAITLIST RECOMMENDED
              </div>
            )}
          </div>

          {/* FRIER */}
          <div className={`border rounded-lg p-4 ${borderColor(frierPct)}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="font-mono font-bold text-jarvis-text">FRIER (RTC)</div>
              <div className={`font-mono font-bold text-xl ${statusColor(frierPct)}`}>
                {frierPct}%
              </div>
            </div>
            <div className="text-jarvis-dim text-xs font-mono mb-3">
              Glendale · Male Residential · 8105 W Frier Dr
            </div>
            <OccupancyBar value={frierCount} max={RTC_BEDS} />
            <div className="flex justify-between text-xs font-mono text-jarvis-dim mt-2">
              <span>{frierCount}/{RTC_BEDS} beds occupied</span>
              <span>{RTC_BEDS - frierCount} open</span>
            </div>
            {frierPct < 50 && (
              <div className="text-jarvis-red text-xs font-mono mt-2 font-bold">
                🚨 CRITICAL — BELOW 50% · SURGE CAMPAIGN RECOMMENDED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OUTPATIENT PROGRAMS */}
      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-5">
        <div className="text-jarvis-cyan font-mono font-bold text-sm tracking-wider mb-1">
          📋 OUTPATIENT PROGRAMS — PHOENIX
        </div>
        <div className="text-jarvis-dim text-xs font-mono mb-4 opacity-60">
          4160 N 108th Ave · Headcount only · No bed capacity limit
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'PHP', name: 'Partial Hospitalization', count: phpDisplay, live: true },
            { label: 'IOP', name: 'Intensive Outpatient', count: iopCount, live: false },
            { label: 'OP', name: 'Outpatient', count: opCount, live: false },
            { label: 'TMS', name: 'NeuroStar TMS', count: tmsCount, live: false },
          ].map((prog, i) => (
            <div key={i} className={`border rounded-lg p-4 text-center ${
              prog.count > 0 ? 'border-jarvis-green border-opacity-50' : 'border-jarvis-border'
            }`}>
              <div className={`text-xs font-mono mb-1 font-bold ${
                prog.count > 0 ? 'text-jarvis-cyan' : 'text-jarvis-dim'
              }`}>{prog.label}</div>
              <div className={`text-4xl font-bold font-mono mb-1 ${
                prog.count > 0 ? 'text-jarvis-cyan' : 'text-jarvis-dim'
              }`}>{prog.count}</div>
              <div className="text-xs font-mono text-jarvis-dim opacity-70">{prog.name}</div>
              {!prog.live && prog.count === 0 && (
                <div className="text-jarvis-dim text-xs font-mono mt-2 opacity-40 italic">
                  newly launched
                </div>
              )}
            </div>
          ))}
        </div>
        {indianSchool && (
          <div className="text-jarvis-dim text-xs font-mono mt-3 opacity-50">
            Source: Kipu Indian School location · {indianSchool.occupied} total outpatient patients
          </div>
        )}
      </div>

      {/* SOBER LIVING */}
      {moody && (
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-5">
          <div className="text-jarvis-cyan font-mono font-bold text-sm tracking-wider mb-1">
            🏠 SOBER LIVING — MOODY TRAIL
          </div>
          <div className="text-jarvis-dim text-xs font-mono mb-4 opacity-60">
            1623 W Moody Trail · Not included in RTC occupancy
          </div>
          <div className="border border-jarvis-border rounded-lg p-4 inline-block">
            <div className="text-xs font-mono text-jarvis-dim mb-1">CURRENT RESIDENTS</div>
            <div className="text-4xl font-bold font-mono text-jarvis-cyan">
              {moody.occupied}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
