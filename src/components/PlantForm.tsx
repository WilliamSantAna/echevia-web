import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { assertPhotoSize, assertShortVideo, captureVideoPoster, compressImage, isHttpUrl } from '../lib/media'
import { createId, slugifyIdentification } from '../lib/id'
import {
  fetchStorageUsage,
  STORAGE_OVERFLOW_PHOTO,
  STORAGE_OVERFLOW_VIDEO,
  storageWouldOverflow,
} from '../lib/plantsApi'
import { writeDevicePoster } from '../lib/videoPoster'
import { usePlants } from '../store/plants'
import {
  MAX_PHOTOS,
  MAX_VIDEO_SECONDS,
  type Plant,
  type PlantDraft,
  type PlantPhoto,
  type PlantVideo,
} from '../types/plant'
import { CameraIcon, StarIcon } from './Icons'
import { ProtectedPhoto } from './ProtectedPhoto'
import type { IdentifyPrefill } from '../lib/plantnet'

export type MediaMode = 'photos' | 'video' | 'all'

type PlantFormProps = {
  initial?: Plant
  prefill?: IdentifyPrefill
  mediaMode?: MediaMode
  identificationTaken: (identification: string, ignoreId?: string) => boolean
  onSubmit: (draft: PlantDraft) => void | Promise<void>
}

function isPersistedPhoto(photo: PlantPhoto) {
  return Boolean(photo.key) || isHttpUrl(photo.url) || photo.url.startsWith('/')
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
  const { storage, syncPlantMedia } = usePlants()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [shell, setShell] = useState<HTMLElement | null>(null)
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
  const locked = saving

  useEffect(() => {
    setShell(document.querySelector('.app-shell'))
  }, [])

  useEffect(() => {
    if (!pickerOpen || locked) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pickerOpen, locked])

  const persistedVideos = (): PlantVideo[] => {
    if (!videoUrl) return []
    if (!isHttpUrl(videoUrl) && !initial?.videos[0]?.key) return []
    return [
      {
        id: initial?.videos[0]?.id ?? createId(),
        url: videoUrl,
        posterUrl: videoPoster,
        durationSeconds: videoDuration || MAX_VIDEO_SECONDS,
        key: initial?.videos[0]?.key,
        posterKey: initial?.videos[0]?.posterKey,
      },
    ]
  }

  const ensureQuota = async (extraBytes: number, overflowMessage: string) => {
    const usage = storage ?? (await fetchStorageUsage().catch(() => null))
    if (usage && storageWouldOverflow(usage.usedBytes, usage.limitBytes, extraBytes)) {
      throw new Error(overflowMessage)
    }
  }

  const addPhotos = async (files: FileList | File[] | null) => {
    if (!allowPhotos || !files?.length || locked) return
    setError('')
    const remaining = MAX_PHOTOS - photos.length
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remaining)
    if (selected.length === 0) return
    try {
      for (const file of selected) assertPhotoSize(file)
      await ensureQuota(
        selected.reduce((sum, file) => sum + file.size, 0),
        STORAGE_OVERFLOW_PHOTO,
      )
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível processar a foto.')
    }
  }

  const addVideo = async (file: File | undefined) => {
    if (!allowVideo || !file || locked) return
    setError('')
    try {
      await ensureQuota(file.size, STORAGE_OVERFLOW_VIDEO)
      const duration = await assertShortVideo(file)
      const url = URL.createObjectURL(file)
      const poster = (await captureVideoPoster(url)) || ''
      setVideoUrl((current) => {
        if (current.startsWith('blob:')) URL.revokeObjectURL(current)
        return url
      })
      setVideoDuration(duration)
      setVideoPoster(poster)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vídeo inválido')
    }
  }

  const addCapturedMedia = async (files: FileList | null) => {
    if (!files?.length || locked) return
    const all = Array.from(files)
    if (allowPhotos) await addPhotos(all.filter((file) => file.type.startsWith('image/')))
    if (allowVideo) await addVideo(all.find((file) => file.type.startsWith('video/')))
  }

  const removePhoto = async (photoId: string) => {
    if (locked) return
    const previous = photos
    const next = photos.filter((item) => item.id !== photoId)
    if (next.length && !next.some((item) => item.isMain)) {
      next[0] = { ...next[0], isMain: true }
    }
    setPhotos(next)
    const removed = previous.find((item) => item.id === photoId)
    if (!initial?.id || !removed || !isPersistedPhoto(removed)) return
    try {
      await syncPlantMedia(
        initial.id,
        next.filter(isPersistedPhoto),
        persistedVideos(),
      )
    } catch (err) {
      setPhotos(previous)
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a foto.')
    }
  }

  const removeVideo = async () => {
    if (locked) return
    const previous = { videoUrl, videoPoster, videoDuration }
    const hadPersisted = Boolean(initial?.videos[0] && (initial.videos[0].key || isHttpUrl(previous.videoUrl)))
    if (previous.videoUrl.startsWith('blob:')) URL.revokeObjectURL(previous.videoUrl)
    setVideoUrl('')
    setVideoPoster('')
    setVideoDuration(0)
    if (!initial?.id || !hadPersisted) return
    try {
      await syncPlantMedia(initial.id, photos.filter(isPersistedPhoto), [])
    } catch (err) {
      setVideoUrl(previous.videoUrl)
      setVideoPoster(previous.videoPoster)
      setVideoDuration(previous.videoDuration)
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o vídeo.')
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (locked) return
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
              posterUrl: videoPoster,
              durationSeconds: videoDuration || MAX_VIDEO_SECONDS,
              key: initial?.videos[0]?.key,
              posterKey: initial?.videos[0]?.posterKey,
            },
          ]
        : []
    if (videos[0] && videoPoster) writeDevicePoster(videos[0].id, videoPoster)

    setPickerOpen(false)
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        species: species.trim(),
        botanicalFamily: botanicalFamily.trim(),
        identification: idValue,
        notes: notes.trim(),
        photos: allowPhotos ? photos : initial?.photos ?? [],
        videos: allowVideo ? videos : initial?.videos ?? [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a planta.')
      setSaving(false)
    }
  }

  const cameraAccept = allowVideo && !allowPhotos ? 'video/*' : allowPhotos && !allowVideo ? 'image/*' : 'image/*,video/*'
  const galleryAccept = allowVideo && !allowPhotos ? 'video/*' : 'image/*'
  const galleryMultiple = allowPhotos

  return (
    <form className={`form${locked ? ' is-saving' : ''}`} onSubmit={handleSubmit} aria-busy={locked}>
      <fieldset className="form-lock" disabled={locked}>
        <button type="submit" className="btn btn-primary form-save" disabled={locked}>
          {locked ? 'Salvando…' : 'Salvar planta'}
        </button>
        {error ? <p className="form-error">{error}</p> : null}

        <label>
          Nome
          <input value={name} onChange={(event) => setName(event.target.value)} required readOnly={locked} />
        </label>
        <label>
          Espécie
          <input value={species} onChange={(event) => setSpecies(event.target.value)} readOnly={locked} />
        </label>
        <label>
          Família botânica
          <input
            value={botanicalFamily}
            onChange={(event) => setBotanicalFamily(event.target.value)}
            readOnly={locked}
          />
        </label>
        <label>
          Identificação
          <input
            value={identification}
            onChange={(event) => setIdentification(event.target.value)}
            placeholder="ECH-001"
            required
            readOnly={locked}
          />
        </label>
        <label>
          Observações
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} readOnly={locked} />
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
                  disabled={locked}
                >
                  <StarIcon filled={photo.isMain} />
                </button>
                <button
                  type="button"
                  className="remove"
                  onClick={() => void removePhoto(photo.id)}
                  aria-label="Remover foto"
                  disabled={locked}
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
              onClick={() => void removeVideo()}
              disabled={locked}
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
            disabled={locked}
          >
            <CameraIcon />
          </button>
        </div>
      </fieldset>
      <input
        ref={cameraRef}
        type="file"
        accept={cameraAccept}
        capture="environment"
        hidden
        disabled={locked}
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
        disabled={locked}
        onChange={(event) => {
          const files = event.target.files
          if (allowPhotos && !allowVideo) void addPhotos(files)
          else if (allowVideo && !allowPhotos) void addVideo(files?.[0])
          else void addCapturedMedia(files)
          event.target.value = ''
        }}
      />

      {pickerOpen && !locked ? (
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

      {locked && shell
        ? createPortal(
            <div className="form-saving" role="status" aria-live="assertive">
              <div className="form-saving__card">
                <span className="form-saving__spinner" aria-hidden="true" />
                <p>Salvando planta…</p>
                <p className="form-saving__hint">Enviando fotos e vídeos. Isso pode levar alguns segundos.</p>
              </div>
            </div>,
            shell,
          )
        : null}
    </form>
  )
}
