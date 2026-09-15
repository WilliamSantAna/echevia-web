import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { PlantForm, type MediaMode } from '../components/PlantForm'
import { usePlants } from '../store/plants'
import type { IdentifyPrefill } from '../lib/plantnet'

function readPrefill(value: unknown): IdentifyPrefill | undefined {
  if (!value || typeof value !== 'object') return undefined
  const data = value as IdentifyPrefill
  if (!data.photoUrl && !data.species && !data.name) return undefined
  return data
}

export function NewPlantPage() {
  const { identificationTaken, savePlant } = usePlants()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const mediaMode: MediaMode = params.get('midia') === 'video' ? 'video' : 'photos'
  const prefill = readPrefill(location.state)

  return (
    <PlantForm
      mediaMode={mediaMode}
      prefill={prefill}
      identificationTaken={identificationTaken}
      onSubmit={(draft) => {
        const plant = savePlant(draft)
        if (mediaMode === 'video') {
          navigate('/videos', { replace: true })
          return
        }
        navigate(draft.photos.length ? `/plantas/${plant.id}` : '/', { replace: true })
      }}
    />
  )
}
