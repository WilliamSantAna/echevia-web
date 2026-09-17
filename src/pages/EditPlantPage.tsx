import { useNavigate, useParams } from 'react-router-dom'
import { PlantForm } from '../components/PlantForm'
import { usePlants } from '../store/plants'

export function EditPlantPage() {
  const { id = '' } = useParams()
  const { getById, identificationTaken, savePlant } = usePlants()
  const plant = getById(id)
  const navigate = useNavigate()

  if (!plant) {
    return (
      <div className="empty">
        <h2>Planta não encontrada</h2>
      </div>
    )
  }

  return (
    <PlantForm
      initial={plant}
      identificationTaken={identificationTaken}
      onSubmit={async (draft) => {
        await savePlant(draft, plant.id)
        navigate(`/plantas/${plant.id}`, { replace: true })
      }}
    />
  )
}