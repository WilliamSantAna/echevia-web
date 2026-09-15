import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IdentifyPicker } from '../components/IdentifyPicker'
import { dataUrlToFile } from '../lib/media'
import {
  identifySpecies,
  IdentifyError,
  prefillFromMatch,
  type IdentifyLocationState,
  type PlantNetMatch,
} from '../lib/plantnet'

function readState(value: unknown): IdentifyLocationState | null {
  if (!value || typeof value !== 'object') return null
  const imageDataUrl = (value as IdentifyLocationState).imageDataUrl
  return typeof imageDataUrl === 'string' && imageDataUrl ? { imageDataUrl } : null
}

export function IdentifyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const incoming = readState(location.state)
  const [pickerOpen, setPickerOpen] = useState(!incoming)
  const [loading, setLoading] = useState(Boolean(incoming))
  const [error, setError] = useState('')
  const [matches, setMatches] = useState<PlantNetMatch[]>([])

  useEffect(() => {
    if (!incoming) {
      setLoading(false)
      setMatches([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')
    setMatches([])

    void identifySpecies(dataUrlToFile(incoming.imageDataUrl))
      .then((next) => {
        if (!cancelled) setMatches(next)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof IdentifyError ? err.message : 'Não foi possível identificar a espécie.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [incoming?.imageDataUrl])

  return (
    <article className="identify-page">
      {incoming ? (
        <div className="identify-hero">
          <img src={incoming.imageDataUrl} alt="Foto enviada para identificação" />
        </div>
      ) : (
        <div className="empty">
          <h2>Identificar espécie</h2>
          <p>Abra a câmera ou escolha uma foto da galeria para consultar a Pl@ntNet.</p>
        </div>
      )}

      {loading ? <p className="identify-status">Consultando a Pl@ntNet…</p> : null}
      {error ? <p className="identify-error">{error}</p> : null}

      {matches.length > 0 ? (
        <ol className="identify-list">
          {matches.map((match, index) => (
            <li key={`${match.scientificName}-${index}`}>
              <div className="identify-match">
                {match.imageUrl ? (
                  <img src={match.imageUrl} alt="" className="identify-match__thumb" />
                ) : (
                  <div className="identify-match__thumb identify-match__thumb--empty" />
                )}
                <div className="identify-match__body">
                  <strong>{match.scientificName}</strong>
                  <span>{match.commonName}</span>
                  {match.family ? <em>{match.family}</em> : null}
                  <b>{Math.round(match.score * 100)}%</b>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!incoming) return
                  navigate('/nova', {
                    state: prefillFromMatch(match, incoming.imageDataUrl),
                  })
                }}
              >
                Cadastrar esta planta
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="identify-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setPickerOpen(true)}>
          {incoming ? 'Outra foto' : 'Escolher foto'}
        </button>
        <Link className="btn btn-ghost" to="/">
          Cancelar
        </Link>
      </div>
      <p className="identify-credit">Identificação via Pl@ntNet</p>
      <IdentifyPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </article>
  )
}
