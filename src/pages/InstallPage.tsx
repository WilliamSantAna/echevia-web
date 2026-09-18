import { useEffect, useState } from 'react'
import {
  getDeviceLabel,
  getInstallPlatform,
  needsSafariForInstall,
  subscribeInstallPrompt,
  type BeforeInstallPromptEvent,
} from '../lib/install'

const shots = [
  { file: 'gallery.jpg', alt: 'Galeria da coleção' },
  { file: 'plant.jpg', alt: 'Ficha de uma suculenta' },
  { file: 'videos.jpg', alt: 'Vídeos da coleção' },
] as const

function asset(path: string) {
  return `${import.meta.env.BASE_URL}${path}`
}

function IosShareGlyph() {
  return (
    <svg className="store-step__glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M7 11v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8" />
    </svg>
  )
}

export function InstallPage() {
  const platform = getInstallPlatform()
  const device = getDeviceLabel()
  const safariHint = needsSafariForInstall()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => subscribeInstallPrompt(setDeferred), [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
  }

  const showInstallButton = platform === 'android' && Boolean(deferred) && !installed

  return (
    <main className="store-page">
      <header className="store-hero">
        <img className="store-hero__icon" src={asset('icons/icon-192.png')} alt="" width={88} height={88} />
        <div className="store-hero__meta">
          <h1>Echevia</h1>
          <p className="store-hero__owner">William Sant Ana</p>
          <p className="store-hero__license">Free License - No Ads</p>
        </div>
      </header>

      {installed ? (
        <p className="store-ready">Pronto. Abra a Echevia pelo ícone na tela inicial.</p>
      ) : showInstallButton ? (
        <button type="button" className="store-install" onClick={() => void install()}>
          Install
        </button>
      ) : (
        <section className="store-howto" aria-label="Como instalar">
          {safariHint ? (
            <p className="store-howto__lead">
              No {device}, abra este site no <strong>Safari</strong> para instalar o app.
            </p>
          ) : (
            <p className="store-howto__lead">Para usar a Echevia neste {device}, instale o aplicativo:</p>
          )}
          {platform === 'ios' ? (
            <ol className="store-steps">
              <li>
                <IosShareGlyph />
                Toque em <strong>Compartilhar</strong>
              </li>
              <li>
                <span className="store-step__n">2</span>
                Toque em <strong>Adicionar à Tela de Início</strong>
              </li>
              <li>
                <span className="store-step__n">3</span>
                Toque em <strong>Adicionar</strong>
              </li>
            </ol>
          ) : (
            <ol className="store-steps">
              <li>
                <span className="store-step__n">1</span>
                Toque no menu <strong>⋮</strong> do navegador
              </li>
              <li>
                <span className="store-step__n">2</span>
                Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>
              </li>
              <li>
                <span className="store-step__n">3</span>
                Confirme a instalação
              </li>
            </ol>
          )}
        </section>
      )}

      <section className="store-shots" aria-label="Imagens do aplicativo">
        {shots.map((shot) => (
          <img key={shot.file} src={asset(`install/${shot.file}`)} alt={shot.alt} />
        ))}
      </section>

      <section className="store-about">
        <h2>Sobre</h2>
        <p>
          A Echevia organiza sua coleção de suculentas com fotos, vídeos e anotações — no seu aparelho, sem
          anúncios.
        </p>
      </section>
    </main>
  )
}
