import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PhotoCarousel } from '../components/PhotoCarousel'
import { PlantStack } from '../components/PlantStack'
import { PlantVideoPlayer } from '../components/PlantVideoPlayer'
import { HeartIcon, PencilIcon, ShareIcon, TrashIcon } from '../components/Icons'
import { formatDate } from '../lib/dates'
import { hasPlantPhoto, plantPhotos } from '../lib/plant'
import { sharePlant } from '../lib/share'
import { usePlants } from '../store/plants'
import type { Plant } from '../types/plant'

function plantDetailPath(plant: Plant, videoMode: boolean) {
  if (videoMode && plant.videos.length > 0) return `/plantas/${plant.id}?midia=video`
  return `/plantas/${plant.id}`
}

export function PlantDetailPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const { plants, getById } = usePlants()
  const plant = getById(id)
  const navigate = useNavigate()
  const videoMode = params.get('midia') === 'video'

  if (!plant) {
    return (
      <div className="empty">
        <h2>Planta não encontrada</h2>
        <Link to="/">Voltar à galeria</Link>
      </div>
    )
  }

  const feed = (videoMode ? plants.filter((item) => item.videos.some((video) => video.url)) : plants.filter(hasPlantPhoto))
  const inFeed = feed.some((item) => item.id === plant.id)

  if (!inFeed) {
    if (!videoMode && plant.videos.some((video) => video.url)) {
      return <Navigate to={`/plantas/${plant.id}?midia=video`} replace />
    }
    return (
      <div className="empty">
        <h2>{videoMode ? 'Vídeo não encontrado' : 'Planta sem foto'}</h2>
        <Link to={videoMode ? '/videos' : '/'}>Voltar</Link>
      </div>
    )
  }

  return (
    <PlantStack
      plants={feed}
      currentId={plant.id}
      onCurrentIdChange={(id) => {
        const target = feed.find((item) => item.id === id)
        if (!target) return
        navigate(plantDetailPath(target, videoMode), { replace: true })
      }}
    >
      {(card, { priority }) => (
        <PlantDetailCard plant={card} videoMode={videoMode} priority={priority} />
      )}
    </PlantStack>
  )
}

function PlantDetailCard({
  plant,
  videoMode,
  priority,
}: {
  plant: Plant
  videoMode: boolean
  priority: boolean
}) {
  const navigate = useNavigate()
  const { toggleFavorite, removePlant } = usePlants()
  const photos = plantPhotos(plant)
  const videos = plant.videos
  const showVideo = (videoMode && videos.length > 0) || (photos.length === 0 && videos.length > 0)
  const [active, setActive] = useState(0)
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <article className="plant-page">
      {showVideo ? (
        <PlantVideoPlayer
          videos={videos}
          plantName={plant.name}
          active={active}
          onActiveChange={setActive}
        />
      ) : (
        <PhotoCarousel
          photos={photos}
          plantName={plant.name}
          active={active}
          onActiveChange={setActive}
          priority={priority}
        />
      )}
      <div className="plant-body">
        <div className="plant-kicker">{plant.identification}</div>
        <div className="plant-heading">
          <h1>{plant.name}</h1>
          <div className="plant-heading__actions">
            {showVideo ? null : (
              <button
                type="button"
                className={`icon-btn icon-btn-heart${plant.favorite ? ' is-fav' : ''}`}
                aria-label={plant.favorite ? 'Remover dos favoritos' : 'Favoritar'}
                onClick={() => toggleFavorite(plant.id)}
              >
                <HeartIcon filled={plant.favorite} />
              </button>
            )}
            <button
              type="button"
              className="icon-btn icon-btn-danger"
              aria-label="Excluir"
              onClick={() => setConfirmDelete(true)}
            >
              <TrashIcon />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Compartilhar"
              onClick={async () => {
                try {
                  const result = await sharePlant(plant.name, plant.identification)
                  if (result === 'copied') setToast('Link copiado')
                  window.setTimeout(() => setToast(''), 1800)
                } catch {
                  setToast('Não foi possível compartilhar')
                  window.setTimeout(() => setToast(''), 1800)
                }
              }}
            >
              <ShareIcon />
            </button>
          </div>
        </div>
        <p className="species">{plant.species}</p>
        {plant.botanicalFamily ? <span className="chip">{plant.botanicalFamily}</span> : null}
        <p className="updated-at">{formatDate(plant.updatedAt)}</p>
        {plant.notes ? <p className="notes">{plant.notes}</p> : null}
        <div className="actions-row">
          <Link className="btn btn-primary" to={`/plantas/${plant.id}/editar`}>
            <PencilIcon /> Editar
          </Link>
        </div>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
      {confirmDelete ? (
        <div className="sheet" onClick={() => setConfirmDelete(false)}>
          <div
            className="sheet__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="delete-title">
              Excluir <strong>{plant.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                removePlant(plant.id)
                navigate('/', { replace: true })
              }}
            >
              Excluir
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}
