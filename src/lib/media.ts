import { MAX_VIDEO_SECONDS } from '../types/plant'

async function compressWithBitmap(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const max = 1400
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas indisponível')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}

function compressWithImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      const max = 1400
      const scale = Math.min(1, max / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas indisponível'))
        return
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem'))
    }
    image.src = url
  })
}

export async function compressImage(file: File): Promise<string> {
  try {
    return await compressWithBitmap(file)
  } catch {
    return compressWithImage(file)
  }
}

export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = video.duration
      URL.revokeObjectURL(video.src)
      resolve(duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Não foi possível ler o vídeo'))
    }
    video.src = URL.createObjectURL(file)
  })
}

export async function assertShortVideo(file: File): Promise<number> {
  const duration = await readVideoDuration(file)
  if (duration > MAX_VIDEO_SECONDS + 0.4) {
    throw new Error(`O vídeo deve ter no máximo ${MAX_VIDEO_SECONDS} segundos`)
  }
  return Math.min(MAX_VIDEO_SECONDS, Math.round(duration))
}

export function isHttpUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

const posterCache = new Map<string, Promise<string>>()

function snapshotVideoFrame(video: HTMLVideoElement): string {
  if (video.videoWidth < 2 || video.videoHeight < 2) return ''
  const max = 1400
  const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

function firstFrameTime(video: HTMLVideoElement): number {
  const duration = video.duration
  if (Number.isFinite(duration) && duration > 0) {
    return Math.min(0.12, Math.max(0.04, duration * 0.02))
  }
  return 0.1
}

export function captureVideoPoster(src: string): Promise<string> {
  const cached = posterCache.get(src)
  if (cached) return cached

  const pending = new Promise<string>((resolve) => {
    const video = document.createElement('video')
    let settled = false
    const finish = (url: string) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      video.removeAttribute('src')
      video.load()
      resolve(url)
    }

    const timer = window.setTimeout(() => finish(''), 8000)
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.preload = 'auto'
    video.setAttribute('playsinline', 'true')
    video.setAttribute('webkit-playsinline', 'true')
    if (src.startsWith('http://') || src.startsWith('https://')) {
      video.crossOrigin = 'anonymous'
    }

    const snap = () => {
      try {
        const url = snapshotVideoFrame(video)
        if (url) finish(url)
      } catch {
        finish('')
      }
    }

    video.addEventListener('seeked', snap)
    video.addEventListener('loadeddata', () => {
      try {
        video.currentTime = firstFrameTime(video)
      } catch {
        snap()
      }
    })
    video.addEventListener('error', () => finish(''))
    video.src = src
    video.load()
  }).then((url) => {
    if (!url) posterCache.delete(src)
    return url
  })

  posterCache.set(src, pending)
  return pending
}

export function dataUrlToFile(dataUrl: string, filename = 'planta.jpg'): File {
  const [header, encoded = ''] = dataUrl.split(',')
  const mime = /data:(.*?);/.exec(header)?.[1] ?? 'image/jpeg'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new File([bytes], filename, { type: mime })
}
