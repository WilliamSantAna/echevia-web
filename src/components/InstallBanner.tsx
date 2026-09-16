import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'echevia.install.dismissed.v1'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosHint, setIosHint] = useState(false)
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent)

  useEffect(() => {
    if (isStandalone() || sessionStorage.getItem(DISMISS_KEY) || !isMobile()) return

    setVisible(true)

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const install = async () => {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') setVisible(false)
      setDeferred(null)
      return
    }
    setIosHint(true)
  }

  return (
    <div className="install-banner is-visible" role="status">
      <p>
        {iosHint || (ios && !deferred)
          ? 'Para instalar: Compartilhar → Adicionar à Tela de Início'
          : 'Instalar a Echevia neste aparelho'}
      </p>
      {iosHint || (ios && !deferred) ? null : (
        <button type="button" className="install-banner__install" onClick={() => void install()}>
          Instalar
        </button>
      )}
      <button type="button" className="install-banner__close" aria-label="Fechar" onClick={dismiss}>
        ×
      </button>
    </div>
  )
}
