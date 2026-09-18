import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import logoTextInk from '../assets/logo-text-ink.png'
import { formatDate } from '../lib/dates'
import { usePlants } from '../store/plants'
import { ProtectedPhoto } from '../components/ProtectedPhoto'

function useForcedLightTheme() {
  useEffect(() => {
    const html = document.documentElement
    const meta = document.querySelector('meta[name="theme-color"]')
    const previousTheme = html.dataset.theme
    const previousColor = meta?.getAttribute('content')
    html.dataset.theme = 'light'
    meta?.setAttribute('content', '#ffffff')
    return () => {
      if (previousTheme) html.dataset.theme = previousTheme
      else delete html.dataset.theme
      if (previousColor) meta?.setAttribute('content', previousColor)
    }
  }, [])
}

export function SharePage() {
  const { identification = '' } = useParams()
  const { getByIdentification } = usePlants()
  const plant = getByIdentification(decodeURIComponent(identification))
  useForcedLightTheme()

  if (!plant) {
    return (
      <main className="share-page">
        <header>
          <img className="topbar__logo" src={logoTextInk} alt="Echevia" />
        </header>
        <h1>Planta não encontrada</h1>
        <p>Este link da Echevia não corresponde a nenhuma suculenta da coleção.</p>
      </main>
    )
  }

  return (
    <main className="share-page">
      <header>
        <img className="topbar__logo" src={logoTextInk} alt="Echevia" />
      </header>
      <div className="plant-kicker">{plant.identification}</div>
      <h1>{plant.name}</h1>
      <p className="species">{plant.species}</p>
      {plant.botanicalFamily ? <span className="chip">{plant.botanicalFamily}</span> : null}
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
      {plant.notes ? <p className="notes">{plant.notes}</p> : null}
    </main>
  )
}
