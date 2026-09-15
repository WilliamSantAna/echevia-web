import { useEffect, useRef, useState, type FormEvent } from 'react'
import { assertShortVideo, compressImage } from '../lib/media'
import { createId, slugifyIdentification } from '../lib/id'
import { MAX_PHOTOS, MAX_VIDEO_SECONDS, type Plant, type PlantDraft, type PlantPhoto } from '../types/plant'
import { CameraIcon, StarIcon } from './Icons'
import { ProtectedPhoto } from './ProtectedPhoto'
import type { IdentifyPrefill } from '../lib/plantnet'

export type MediaMode = 'photos' | 'video' | 'all'

type PlantFormProps = {
  initial?: Plant
  prefill?: IdentifyPrefill
  mediaMode?: MediaMode
  identificationTaken: (identification: string, ignoreId?: string) => boolean
  onSubmit: (draft: PlantDraft) => void
}

export function PlantForm({
  initial,
  prefill,
  mediaMode = 'all',
  identificationTaken,
  onSubmit,
}: PlantFormProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [name, setName] = useState(initial?.name ?? prefill?.name ?? '')
  const [species, setSpecies] = useState(initial?.species ?? prefill?.species ?? '')
  const [botanicalFamily, setBotanicalFamily] = useState(initial?.botanicalFamily ?? prefill?.botanicalFamily ?? '')
  const [identification, setIdentification] = useState(initial?.identification ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [photos, setPhotos] = useState<PlantPhoto[]>(
    initial?.photos ??
      (prefill?.photoUrl ? [{ id: createId(), url: prefill.photoUrl, isMain: true }] : []),
  )
  const [videoUrl, setVideoUrl] = useState(initial?.videos[0]?.url ?? '')
  const [videoPoster, setVideoPoster] = useState(initial?.videos[0]?.posterUrl ?? '')
  const [videoDuration, setVideoDuration] = useState(initial?.videos[0]?.durationSeconds ?? 0)

  const allowPhotos = mediaMode !== 'video'
  const allowVideo = mediaMode !== 'photos'

  useEffect(() => {
    if (!pickerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pickerOpen])

  const addPhotos = async (files: FileList | File[] | null) => {
    if (!allowPhotos || !files?.length) return
    setError('')
    const remaining = MAX_PHOTOS - photos.length
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remaining)
    if (selected.length === 0) return
    try {
      const next = await Promise.all(
        selected.map(async (file) => ({
          id: createId(),
          url: await compressImage(file),
          isMain: false,
        })),
      )
      setPhotos((current) => {
        const merged = [...current, ...next]
        if (!merged.some((photo) => photo.isMain) && merged[0]) {
          merged[0] = { ...merged[0], isMain: true }
        }
        return merged
      })
    } catch {
      setError('Não foi possível processar a foto.')
    }
  }

  const addVideo = async (file: File | undefined) => {
    if (!allowVideo || !file) return
    setError('')
    try {
      const duration = await assertShortVideo(file)
      const url = URL.createObjectURL(file)
      setVideoUrl((current) => {
        if (current.startsWith('blob:')) URL.revokeObjectURL(current)
        return url
      })
      setVideoDuration(duration)
      setVideoPoster(photos.find((photo) => photo.isMain)?.url ?? photos[0]?.url ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vídeo inválido')
    }
  }

  const addCapturedMedia = async (files: FileList | null) => {
    if (!files?.length) return
    const all = Array.from(files)
    if (allowPhotos) await addPhotos(all.filter((file) => file.type.startsWith('image/')))
    if (allowVideo) await addVideo(all.find((file) => file.type.startsWith('video/')))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const idValue = slugifyIdentification(identification)
    if (!name.trim()) {
      setError('Informe o nome da planta.')
      return
    }
    if (!idValue) {
      setError('Informe uma identificação alfanumérica.')
      return
    }
    if (identificationTaken(idValue, initial?.id)) {
      setError('Essa identificação já está em uso.')
      return
    }
    if (mediaMode === 'photos' && photos.length > MAX_PHOTOS) {
      setError(`Use no máximo ${MAX_PHOTOS} fotos.`)
      return
    }
    if (mediaMode === 'video' && !videoUrl) {
      setError(`Adicione 1 vídeo de até ${MAX_VIDEO_SECONDS} segundos.`)
      return
    }
    if (mediaMode === 'all' && photos.length === 0) {
      setError('Adicione ao menos uma foto.')
      return
    }

    const videos =
      allowVideo && videoUrl
        ? [
            {
              id: initial?.videos[0]?.id ?? createId(),
              url: videoUrl,
              posterUrl: videoPoster || photos.find((photo) => photo.isMain)?.url || photos[0]?.url || '',
              durationSeconds: videoDuration || MAX_VIDEO_SECONDS,
            },
          ]
        : []

    onSubmit({
      name: name.trim(),
      species: species.trim(),
      botanicalFamily: botanicalFamily.trim(),
      identification: idValue,
      notes: notes.trim(),
      photos: allowPhotos ? photos : [],
      videos,
    })
  }

  const cameraAccept = allowVideo && !allowPhotos ? 'video/*' : allowPhotos && !allowVideo ? 'image/*' : 'image/*,video/*'
  const galleryAccept = allowVideo && !allowPhotos ? 'video/*' : 'image/*'
  const galleryMultiple = allowPhotos

  return (
    <form className="form" onSubmit={handleSubmit}>
      <button type="submit" className="btn btn-primary form-save">
        Salvar planta
      </button>
      {error ? <p className="form-error">{error}</p> : null}

      <label>
        Nome
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label>
        Espécie
        <input value={species} onChange={(event) => setSpecies(event.target.value)} />
      </label>
      <label>
        Família botânica
        <input value={botanicalFamily} onChange={(event) => setBotanicalFamily(event.target.value)} />
      </label>
      <label>
        Identificação
        <input
          value={identification}
          onChange={(event) => setIdentification(event.target.value)}
          placeholder="ECH-001"
          required
        />
      </label>
      <label>
        Observações
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>

      {allowPhotos ? (
        <div className="photo-picker">
          {photos.map((photo) => (
            <div className="photo-slot" key={photo.id}>
              <ProtectedPhoto className="is-fill" src={photo.url} alt="" />
              <button
                type="button"
                className={`star${photo.isMain ? ' is-main' : ''}`}
                onClick={() =>
                  setPhotos((current) =>
                    current.map((item) => ({ ...item, isMain: item.id === photo.id })),
                  )
                }
                aria-label="Definir foto principal"
              >
                <StarIcon filled={photo.isMain} />
              </button>
              <button
                type="button"
                className="remove"
                onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))}
                aria-label="Remover foto"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {allowVideo && videoUrl ? (
        <div className="video-slot">
          <video src={videoUrl} muted playsInline />
          <button
            type="button"
            className="remove"
            aria-label="Remover vídeo"
            onClick={() => {
              if (videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl)
              setVideoUrl('')
              setVideoPoster('')
              setVideoDuration(0)
            }}
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="picker-actions">
        <button
          type="button"
          className="picker-camera"
          aria-label={allowVideo && !allowPhotos ? 'Adicionar vídeo' : 'Adicionar foto'}
          onClick={() => setPickerOpen(true)}
        >
          <CameraIcon />
        </button>
      </div>
      <small className="picker-hint">
        {allowPhotos
          ? `${photos.length}/${MAX_PHOTOS} fotos · toque na estrela para a principal`
          : `${videoUrl ? '1/1' : '0/1'} vídeo · até ${MAX_VIDEO_SECONDS}s`}
        {allowVideo && allowPhotos && videoUrl ? ' · vídeo anexado' : ''}
      </small>
      <input
        ref={cameraRef}
        type="file"
        accept={cameraAccept}
        capture="environment"
        hidden
        onChange={(event) => {
          void addCapturedMedia(event.target.files)
          event.target.value = ''
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept={galleryAccept}
        multiple={galleryMultiple}
        hidden
        onChange={(event) => {
          const files = event.target.files
          if (allowPhotos && !allowVideo) void addPhotos(files)
          else if (allowVideo && !allowPhotos) void addVideo(files?.[0])
          else void addCapturedMedia(files)
          event.target.value = ''
        }}
      />

      {pickerOpen ? (
        <div className="sheet" onClick={() => setPickerOpen(false)}>
          <div
            className="sheet__card"
            role="dialog"
            aria-modal="true"
            aria-label="Adicionar mídia"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPickerOpen(false)
                cameraRef.current?.click()
              }}
            >
              {allowVideo && !allowPhotos ? 'Gravar vídeo' : 'Tirar Foto'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setPickerOpen(false)
                galleryRef.current?.click()
              }}
            >
              {allowVideo && !allowPhotos ? 'Galeria de vídeos' : 'Galeria de Fotos'}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  )
}
