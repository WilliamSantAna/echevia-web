const PLANTNET_IDENTIFY = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/identify`

export type PlantNetMatch = {
  score: number
  scientificName: string
  commonName: string
  family: string
  imageUrl?: string
}

export type IdentifyPrefill = {
  name: string
  species: string
  botanicalFamily: string
  photoUrl: string
}

export type IdentifyLocationState = {
  imageDataUrl: string
}

export class IdentifyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IdentifyError'
  }
}

export async function identifySpecies(image: File): Promise<PlantNetMatch[]> {
  const body = new FormData()
  body.append('image', image)

  let response: Response
  try {
    response = await fetch(PLANTNET_IDENTIFY, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body,
    })
  } catch {
    throw new IdentifyError('Não foi possível conectar à API da Echevia. Verifique se o backend está no ar.')
  }

  const payload = (await response.json().catch(() => null)) as
    | { matches?: PlantNetMatch[]; message?: string }
    | null

  if (response.status === 404) {
    throw new IdentifyError(
      payload?.message ||
        'Não encontramos uma espécie nesta foto. Tente outra imagem, de preferência da folha ou da flor.',
    )
  }
  if (response.status === 401 || response.status === 403) {
    throw new IdentifyError(payload?.message || 'A identificação não foi autorizada.')
  }
  if (response.status === 429) {
    throw new IdentifyError(payload?.message || 'Limite de identificações atingido. Tente mais tarde.')
  }
  if (!response.ok) {
    throw new IdentifyError(payload?.message || 'Não foi possível identificar esta foto.')
  }

  const matches = payload?.matches ?? []
  if (matches.length === 0) {
    throw new IdentifyError(
      'Não encontramos uma espécie nesta foto. Tente outra imagem, de preferência da folha ou da flor.',
    )
  }

  return matches.slice(0, 2)
}

export function prefillFromMatch(match: PlantNetMatch, photoUrl: string): IdentifyPrefill {
  return {
    name: match.commonName,
    species: match.scientificName,
    botanicalFamily: match.family,
    photoUrl,
  }
}
