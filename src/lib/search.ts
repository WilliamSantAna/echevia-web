import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { plantMatchesQuery } from './plant'
import type { Plant } from '../types/plant'

const SEARCHABLE = new Set(['/', '/videos'])

export function usePlantSearch() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const query = params.get('q') ?? ''

  const setQuery = (value: string) => {
    if (!SEARCHABLE.has(location.pathname)) {
      const search = value.trim() ? `?q=${encodeURIComponent(value)}` : ''
      navigate(`/${search}`)
      return
    }
    const next = new URLSearchParams(params)
    if (value.trim()) next.set('q', value)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const filterPlants = (plants: Plant[]) => plants.filter((plant) => plantMatchesQuery(plant, query))

  return { query, setQuery, filterPlants }
}