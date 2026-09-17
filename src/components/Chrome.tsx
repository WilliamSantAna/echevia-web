import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import logoTextInk from '../assets/logo-text-ink.png'
import logoTextLight from '../assets/logo-text.png'
import identifyMark from '../assets/identify-mark.png'
import { fetchStorageUsage, formatStorageUsed } from '../lib/plantsApi'
import { usePlantSearch } from '../lib/search'
import { APP_VERSION } from '../lib/version'
import { usePlants } from '../store/plants'
import { useTheme, type Theme } from '../store/theme'
import { IdentifyPicker } from './IdentifyPicker'
import { BackIcon, GridIcon, MenuIcon, PlusIcon, VideosIcon } from './Icons'

type TopBarProps = {
  menuOpen: boolean
  onMenuOpen: () => void
}

export function TopBar({ menuOpen, onMenuOpen }: TopBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const showBack =
    location.pathname === '/nova' ||
    location.pathname === '/identificar' ||
    location.pathname.startsWith('/plantas/') ||
    location.pathname.startsWith('/legal/')
  const logoSrc = theme === 'dark' ? logoTextLight : logoTextInk

  return (
    <header className="topbar">
      {showBack ? (
        <button
          type="button"
          className="topbar__btn"
          aria-label="Voltar"
          onClick={() => navigate(-1)}
        >
          <BackIcon />
        </button>
      ) : (
        <NavLink
          to={location.pathname === '/videos' ? '/nova?midia=video' : '/nova'}
          className="topbar__add"
          aria-label="Nova planta"
        >
          <span className="nav-add__plus">
            <PlusIcon />
          </span>
        </NavLink>
      )}
      <div className="topbar__brand">
        <img className="topbar__logo" src={logoSrc} alt="Echevia" />
      </div>
      <button
        type="button"
        className="topbar__btn"
        aria-label="Menu"
        aria-expanded={menuOpen}
        aria-controls="app-menu"
        onClick={onMenuOpen}
      >
        <MenuIcon />
      </button>
    </header>
  )
}

type MenuDrawerProps = {
  open: boolean
  onClose: () => void
}

export function MenuDrawer({ open, onClose }: MenuDrawerProps) {
  const { theme, setTheme } = useTheme()
  const [usageLabel, setUsageLabel] = useState('…')

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void fetchStorageUsage()
      .then((usage) => {
        if (!cancelled) setUsageLabel(formatStorageUsed(usage.usedBytes))
      })
      .catch(() => {
        if (!cancelled) setUsageLabel('—')
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const choose = (next: Theme) => {
    setTheme(next)
  }

  return (
    <div className={`menu-drawer${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="menu-drawer__scrim" aria-label="Fechar menu" onClick={onClose} />
      <aside id="app-menu" className="menu-drawer__panel" aria-hidden={!open}>
        <h2>Menu</h2>
        <p className="menu-drawer__label">Escolher tema</p>
        <div className="theme-toggle" role="radiogroup" aria-label="Tema">
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'light'}
            className={theme === 'light' ? 'is-active' : ''}
            onClick={() => choose('light')}
          >
            Claro
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'dark'}
            className={theme === 'dark' ? 'is-active' : ''}
            onClick={() => choose('dark')}
          >
            Escuro
          </button>
        </div>
        <div className="menu-drawer__end">
          <section className="menu-section" aria-labelledby="menu-instructions">
            <h3 id="menu-instructions">Instruções</h3>
            <div className="menu-instructions">
              <p>
                O aplicativo foi preparado para suportar até 10GB de fotos e videos. Até agora você
                usou:
                <br />
                <strong>{usageLabel}</strong>.
              </p>
              <p>
                Esse app Echevia é de uso pessoal. Se você passar esse aplicativo para outra pessoa,
                ela poderá incluir, alterar e até excluir suas plantas. Isso é de inteira
                responsabilidade sua. Portanto, se quiser compartilhar o app com alguém, entre em
                contato com o desenvolvedor para apresentar uma solução.
              </p>
              <p>
                Você pode acessar esse app em mais de um dispositivo (celular, tablet ou computador).
                O armazenamento será compartilhado em núvem. Não adicione material protegido por lei
                ou de terceiros sem autorização. Em caso de problemas jurídicos, o desenvolvedor do
                app Echevia se isenta de culpa.
              </p>
            </div>
          </section>
          <section className="menu-section" aria-labelledby="menu-legal">
            <h3 id="menu-legal">LEGAL</h3>
            <nav className="menu-legal">
              <NavLink to="/legal/termos" onClick={onClose}>
                Termos de uso
              </NavLink>
              <NavLink to="/legal/privacidade" onClick={onClose}>
                Política de privacidade
              </NavLink>
              <NavLink to="/legal/licencas" onClick={onClose}>
                Licenças de código aberto
              </NavLink>
            </nav>
          </section>
          <section className="menu-section" aria-labelledby="menu-about">
            <h3 id="menu-about">SOBRE</h3>
            <dl className="menu-about">
              <div>
                <dt>Versão</dt>
                <dd>{APP_VERSION}</dd>
              </div>
              <div>
                <dt>Proprietário</dt>
                <dd>William Sant Ana</dd>
              </div>
              <div>
                <dt>Licenciado para</dt>
                <dd>Paulo Criciúma</dd>
              </div>
            </dl>
          </section>
          <p className="menu-drawer__copy">
            Copyright © 2026 Everest I.M Ltda
          </p>
        </div>
      </aside>
    </div>
  )
}

export function SearchBar() {
  const { query, setQuery } = usePlantSearch()

  return (
    <label className="search-bar">
      <input
        type="search"
        value={query}
        placeholder="Pesquisar"
        aria-label="Pesquisar plantas"
        onChange={(event) => setQuery(event.target.value)}
      />
    </label>
  )
}

export function BottomNav() {
  const location = useLocation()
  const { refreshPlants } = usePlants()
  const [pickerOpen, setPickerOpen] = useState(false)
  const identifyActive = location.pathname === '/identificar'

  return (
    <>
      <nav className="bottom-nav" aria-label="Principal">
        <NavLink to="/" end aria-label="Galeria" onClick={() => void refreshPlants()}>
          <GridIcon />
        </NavLink>
        <button
          type="button"
          className={`bottom-nav__identify${identifyActive ? ' is-active' : ''}`}
          aria-label="Identificar espécie"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen(true)}
        >
          <img className="bottom-nav__identify-mark" src={identifyMark} alt="" />
        </button>
        <NavLink to="/videos" aria-label="Vídeos" onClick={() => void refreshPlants()}>
          <VideosIcon />
        </NavLink>
      </nav>
      <IdentifyPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  )
}
