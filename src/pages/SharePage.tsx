import { Link, useParams } from 'react-router-dom'
import logoText from '../assets/logo-text.png'
import { formatDate } from '../lib/dates'
import { usePlants } from '../store/plants'
import { ProtectedPhoto } from '../components/ProtectedPhoto'

export function SharePage() {
  const { identification = '' } = useParams()
  const { getByIdentification } = usePlants()
  const plant = getByIdentification(decodeURIComponent(identification))

  if (!plant) {
    return (
      <main className="share-page">
        <h1>Planta não encontrada</h1>
        <p>Este link da Echevia não corresponde a nenhuma suculenta da coleção.</p>
      </main>
    )
  }

  return (
    <main className="share-page">
      <header>
        <img className="topbar__logo" src={logoText} alt="Echevia" />
        <div>
          <div className="plant-kicker">{plant.identification}</div>
          <h1>{plant.name}</h1>
        </div>
      </header>
      <p className="species">{plant.species}</p>
      {plant.botanicalFamily ? <span className="chip">{plant.botanicalFamily}</span> : null}
      {plant.notes ? <p className="notes">{plant.notes}</p> : null}
      <div className="share-stack">
        {plant.photos.map((photo, index) => (
          <ProtectedPhoto
            key={photo.id}
            src={photo.url}
            alt={`${plant.name} · foto ${index + 1}`}
            watermark
          />
        ))}
      </div>
      <p className="updated-at">{formatDate(plant.updatedAt)}</p>
      <p className="notes">
        As fotos desta página são apenas para visualização e não podem ser baixadas pelo menu do
        navegador.
      </p>
      <Link className="btn btn-primary" to={`/plantas/${plant.id}`} style={{ marginTop: 16, display: 'inline-block' }}>
        Abrir no app
      </Link>
    </main>
  )
}
