'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const RTC_FACILITIES = ['church', 'frier']
const OUTPATIENT_FACILITIES = ['indian school', 'indian_school', 'indianschool']
const SOBER_LIVING_FACILITIES = ['moody']
const TEST_PATIENT_PATTERNS = ['zzz', 'roger rabbit', 'test', 'billing']

const RTC_BEDS = 10 // per facility

function isTestPatient(name: string): boolean {
  return TEST_PATIENT_PATTERNS.some(p =>
    name.toLowerCase().includes(p.toLowerCase())
  )
}

function classifyLocation(name: string): 'rtc' | 'outpatient' | 'sober_living' | 'unknown' {
  const n = name.toLowerCase()
  if (RTC_FACILITIES.some(f => n.includes(f))) return 'rtc'
  if (OUTPATIENT_FACILITIES.some(f => n.includes(f))) return 'outpatient'
  if (SOBER_LIVING_FACILITIES.some(f => n.includes(f))) return 'sober_living'
  return 'unknown'
}

interface Location {
  name: string
  census: number
  realCensus: number
  testCount: number
  type: 'rtc' | 'outpatient' | 'sober_living' | 'unknown'
  patients?: any[]
}

export default function CensusPage() {
  const [census, setCensus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    api.getCensus(t)
      .then(data => {
        setCensus(data)
        setLastUpdated(new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' }))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-jarvis-cyan font-mono animate-pulse">
      LOADING CENSUS DATA...
    </div>
  )
  if (!census) return (
    <div className="text-jarvis-red font-mono">Census data unavailable — check Kipu connection</div>
  )

  // Process locations
  const rawLocations: Location[] = (census.locations || census.facilities || []).map((loc: any) => {
    const patients = loc.patients || []
    const realPatients = patients.filter((p: any) => !isTestPatient(p.name || p.patient_name || ''))
    return {
      name: loc.name || loc.facility_name,
      census: loc.census || loc.patient_count || patients.length,
      realCensus: realPatients.length,
      testCount: patients.length - realPatients.length,
      type: classifyLocation(loc.name || ''),
      patients: realPatients
    }
  })

  const rtcLocations = rawLocations.filter(l => l.type === 'rtc')
  const outpatientLocations = rawLocations.filter(l => l.type === 'outpatient')
  const soberLivingLocations = rawLocations.filter(l => l.type === 'sober_living')
  const unknownLocations = rawLocations.filter(l => l.type === 'unknown')

  const rtcOccupied = rtcLocations.reduce((sum, l) => sum + l.realCensus, 0)
  const rtcCapacity = rtcLocations.length * RTC_BEDS
  const rtcPct = rtcCapacity > 0 ? Math.round((rtcOccupied / rtcCapacity) * 100) : 0

  const outpatientTotal = outpatientLocations.reduce((sum, l) => sum + l.realCensus, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">
          KIPU CENSUS — BED BOARD
        </h1>
        <div className="text-jarvis-dim text-xs font-mono">
          {lastUpdated} MST {census.cached ? '(cached)' : '(live)'}
        </div>
      </div>

      {/* RTC SUMMARY */}
      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
        <div className="text-jarvis-cyan font-mono font-bold text-sm tracking-wider mb-4">
          🏥 RESIDENTIAL TREATMENT (RTC)
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`border rounded-lg p-4 ${
            rtcPct === 100 ? 'border-jarvis-red bg-jarvis-red bg-opacity-5' :
            rtcPct < 50 ? 'border-jarvis-red' :
            rtcPct < 70 ? 'border-jarvis-yellow' :
            'border-jarvis-green'
          }`}>
            <div className="text-xs font-mono text-jarvis-dim mb-1">TOTAL RTC OCCUPANCY</div>
            <div className={`text-4xl font-bold font-mono ${
              rtcPct === 100 ? 'text-jarvis-red' :
              rtcPct < 50 ? 'text-jarvis-red' :
              rtcPct < 70 ? 'text-jarvis-yellow' :
              'text-jarvis-green'
            }`}>{rtcPct}%</div>
            <div className="text-jarvis-dim text-xs font-mono mt-1">
              {rtcOccupied}/{rtcCapacity} beds occupied
            </div>
            {rtcPct === 100 && (
              <div className="text-jarvis-red text-xs font-mono mt-2 font-bold animate-pulse">
                ⚠️ AT CAPACITY
              </div>
            )}
          </div>
          <div className="border border-jarvis-border rounded-lg p-4">
            <div className="text-xs font-mono text-jarvis-dim mb-1">AVAILABLE BEDS</div>
            <div className="text-4xl font-bold font-mono text-jarvis-cyan">
              {rtcCapacity - rtcOccupied}
            </div>
            <div className="text-jarvis-dim text-xs font-mono mt-1">across RTC facilities</div>
          </div>
          <div className="border border-jarvis-border rounded-lg p-4">
            <div className="text-xs font-mono text-jarvis-dim mb-1">RTC CAPACITY</div>
            <div className="text-4xl font-bold font-mono text-jarvis-cyan">{rtcCapacity}</div>
            <div className="text-jarvis-dim text-xs font-mono mt-1">
              {rtcLocations.length} facilities × {RTC_BEDS} beds
            </div>
          </div>
        </div>

        {/* Individual RTC facilities */}
        <div className="grid grid-cols-2 gap-4">
          {rtcLocations.map((loc, i) => {
            const pct = Math.round((loc.realCensus / RTC_BEDS) * 100)
            return (
              <div key={i} className={`border rounded-lg p-4 ${
                pct === 100 ? 'border-jarvis-red' :
                pct < 50 ? 'border-jarvis-red border-opacity-60' :
                pct < 70 ? 'border-jarvis-yellow' :
                'border-jarvis-green'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono font-bold text-jarvis-text">
                    {loc.name.toUpperCase()} (RTC)
                  </div>
                  <div className={`font-mono font-bold text-lg ${
                    pct === 100 ? 'text-jarvis-red' :
                    pct < 50 ? 'text-jarvis-red' :
                    pct < 70 ? 'text-jarvis-yellow' :
                    'text-jarvis-green'
                  }`}>{pct}%</div>
                </div>
                <div className="w-full bg-jarvis-bg rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      pct === 100 ? 'bg-jarvis-red' :
                      pct < 50 ? 'bg-jarvis-red' :
                      pct < 70 ? 'bg-jarvis-yellow' :
                      'bg-jarvis-green'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-jarvis-dim">
                  <span>{loc.realCensus}/{RTC_BEDS} beds</span>
                  <span>{RTC_BEDS - loc.realCensus} available</span>
                </div>
                {loc.testCount > 0 && (
                  <div className="text-jarvis-yellow text-xs font-mono mt-2 opacity-60">
                    ⚠️ {loc.testCount} test record(s) excluded
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* OUTPATIENT PROGRAMS */}
      {(outpatientLocations.length > 0 || true) && (
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
          <div className="text-jarvis-cyan font-mono font-bold text-sm tracking-wider mb-4">
            📋 OUTPATIENT PROGRAMS — PHOENIX
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'PHP', sublabel: 'Partial Hospitalization',
                count: outpatientLocations.reduce((sum, l) => {
                  const phpPatients = (l.patients || []).filter((p: any) =>
                    (p.level_of_care || p.program || '').toLowerCase().includes('php')
                  )
                  return sum + phpPatients.length
                }, 0) || outpatientTotal
              },
              { label: 'IOP', sublabel: 'Intensive Outpatient', count: 0 },
              { label: 'OP', sublabel: 'Outpatient', count: 0 },
              { label: 'TMS', sublabel: 'NeuroStar TMS Therapy', count: 0 },
            ].map((prog, i) => (
              <div key={i} className="border border-jarvis-border rounded-lg p-4 text-center">
                <div className="text-xs font-mono text-jarvis-dim mb-1">{prog.label}</div>
                <div className="text-3xl font-bold font-mono text-jarvis-cyan mb-1">
                  {prog.count}
                </div>
                <div className="text-xs font-mono text-jarvis-dim opacity-60">
                  {prog.sublabel}
                </div>
                {prog.count === 0 && i > 0 && (
                  <div className="text-jarvis-dim text-xs font-mono mt-1 opacity-40">
                    newly launched
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-jarvis-dim text-xs font-mono mt-3 opacity-50">
            * IOP, OP, TMS headcounts show 0 — programs newly launched.
            PHP count pulled from Kipu Indian School location.
          </div>
        </div>
      )}

      {/* SOBER LIVING */}
      {soberLivingLocations.length > 0 && (
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
          <div className="text-jarvis-cyan font-mono font-bold text-sm tracking-wider mb-4">
            🏠 SOBER LIVING — MOODY
          </div>
          <div className="text-jarvis-dim text-xs font-mono mb-3 opacity-70">
            Not included in RTC occupancy calculations
          </div>
          <div className="grid grid-cols-2 gap-4">
            {soberLivingLocations.map((loc, i) => (
              <div key={i} className="border border-jarvis-border rounded-lg p-4">
                <div className="font-mono font-bold text-jarvis-text mb-2">
                  {loc.name.toUpperCase()}
                </div>
                <div className="text-3xl font-bold font-mono text-jarvis-cyan">
                  {loc.realCensus}
                </div>
                <div className="text-xs font-mono text-jarvis-dim mt-1">current residents</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UNKNOWN locations — show but flag */}
      {unknownLocations.length > 0 && (
        <div className="bg-jarvis-surface border border-jarvis-yellow border-opacity-30 rounded-lg p-4">
          <div className="text-jarvis-yellow font-mono font-bold text-xs mb-3">
            ⚠️ UNCLASSIFIED LOCATIONS — VERIFY WITH KIPU
          </div>
          <div className="space-y-2">
            {unknownLocations.map((loc, i) => (
              <div key={i} className="flex justify-between text-xs font-mono">
                <span className="text-jarvis-text">{loc.name}</span>
                <span className="text-jarvis-cyan">{loc.realCensus} patients</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
