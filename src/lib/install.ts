export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallPlatform = 'ios' | 'android'

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<(event: BeforeInstallPromptEvent | null) => void>()

function notify() {
  for (const listener of listeners) listener(deferredPrompt)
}

export function captureInstallPrompt() {
  if (typeof window === 'undefined') return

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function getDeferredPrompt() {
  return deferredPrompt
}

export function subscribeInstallPrompt(listener: (event: BeforeInstallPromptEvent | null) => void) {
  listeners.add(listener)
  listener(deferredPrompt)
  return () => {
    listeners.delete(listener)
  }
}

function matches(query: string): boolean {
  return Boolean(window.matchMedia?.(query)?.matches)
}

export function isIPadOS(): boolean {
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export function isStandalone(): boolean {
  return (
    matches('(display-mode: standalone)') ||
    matches('(display-mode: fullscreen)') ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

export function isMobileOrTablet(): boolean {
  const ua = navigator.userAgent
  if (isIPadOS()) return true
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Silk/i.test(ua)
}

export function shouldShowInstallPage(): boolean {
  if (typeof window === 'undefined') return false
  return isMobileOrTablet() && !isStandalone()
}

export function getInstallPlatform(): InstallPlatform {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua) || isIPadOS()) return 'ios'
  return 'android'
}

export function getDeviceLabel(): string {
  const ua = navigator.userAgent
  if (getInstallPlatform() === 'ios') {
    if (/iPad/i.test(ua) || isIPadOS()) return 'iPad'
    if (/iPod/i.test(ua)) return 'iPod'
    return 'iPhone'
  }
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet'
  return 'celular'
}

export function needsSafariForInstall(): boolean {
  return getInstallPlatform() === 'ios' && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent)
}
