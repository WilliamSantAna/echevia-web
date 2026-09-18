import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

try {
  sessionStorage.removeItem('echevia.egg.party')
} catch {
  // Ignore: party must not persist across reload.
}

function applyParty(on: boolean) {
  const root = document.documentElement
  if (on) root.dataset.egg = 'party'
  else delete root.dataset.egg
  if (on) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ea580c')
  }
}

type EasterContextValue = {
  party: boolean
  rolling: boolean
  celebrating: boolean
  activateParty: () => void
  barrelRoll: () => void
  celebrateMoonCactus: () => void
}

const EasterContext = createContext<EasterContextValue | null>(null)

export function isBarrelRollQuery(value: string): boolean {
  return value.trim().toLowerCase().replace(/\s+/g, '') === 'easteregg'
}

export function isMoonCactusName(name?: string | null): boolean {
  return (name ?? '').toLowerCase().replace(/\s+/g, ' ').includes('gymnocalycium mihanovichii')
}

export function EasterProvider({ children }: { children: ReactNode }) {
  const [party, setParty] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  const activateParty = useCallback(() => {
    applyParty(true)
    setParty(true)
  }, [])

  const barrelRoll = useCallback(() => {
    setRolling(true)
    window.setTimeout(() => setRolling(false), 4000)
  }, [])

  const celebrateMoonCactus = useCallback(() => {
    activateParty()
    setCelebrating(true)
    window.setTimeout(() => setCelebrating(false), 5000)
  }, [activateParty])

  const value = useMemo(
    () => ({
      party,
      rolling,
      celebrating,
      activateParty,
      barrelRoll,
      celebrateMoonCactus,
    }),
    [party, rolling, celebrating, activateParty, barrelRoll, celebrateMoonCactus],
  )

  return <EasterContext.Provider value={value}>{children}</EasterContext.Provider>
}

export function useEaster(): EasterContextValue {
  const ctx = useContext(EasterContext)
  if (!ctx) {
    throw new Error('useEaster deve ser usado dentro de EasterProvider')
  }
  return ctx
}
