import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { compressImage } from '../lib/media'
import type { IdentifyLocationState } from '../lib/plantnet'

type IdentifyPickerProps = {
  open: boolean
  onClose: () => void
}

export function IdentifyPicker({ open, onClose }: IdentifyPickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const sendPhoto = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    onClose()
    try {
      const imageDataUrl = await compressImage(file)
      const state: IdentifyLocationState = { imageDataUrl }
      navigate('/identificar', {
        state,
        replace: location.pathname === '/identificar',
      })
    } catch {
      // compress failure: stay on current page
    }
  }

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => {
          void sendPhoto(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          void sendPhoto(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {open ? (
        <div className="sheet" onClick={onClose}>
          <div
            className="sheet__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="identify-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="identify-title" className="sheet__title">
              Identificar Espécie
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose()
                cameraRef.current?.click()
              }}
            >
              Abrir Camera
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                onClose()
                galleryRef.current?.click()
              }}
            >
              Galeria de Fotos
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
