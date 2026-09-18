import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import logoTextInk from '../assets/logo-text-ink.png'
import logoTextLight from '../assets/logo-text.png'
import identifyMark from '../assets/identify-mark.png'
import easterEgg1 from '../assets/easter-egg-1.jpeg'
import { formatStorageUsed } from '../lib/plantsApi'
import { usePlantSearch } from '../lib/search'
import { APP_VERSION } from '../lib/version'
import { isBarrelRollQuery, useEaster } from '../store/easter'
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
  const { storage: usage, refreshStorage } = usePlants()
  const usageLabel = usage ? formatStorageUsed(usage.usedBytes) : open ? '…' : '—'
  const [licenseEgg, setLicenseEgg] = useState(false)
  const licenseClicks = useRef({ count: 0, at: 0 })

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
    void refreshStorage()
  }, [open, refreshStorage])

  const choose = (next: Theme) => {
    setTheme(next)
  }

  const tapLicense = () => {
    const now = Date.now()
    if (now - licenseClicks.current.at > 900) licenseClicks.current.count = 0
    licenseClicks.current.count += 1
    licenseClicks.current.at = now
    if (licenseClicks.current.count < 5) return
    licenseClicks.current.count = 0
    setLicenseEgg(true)
  }

  const usageRatio = usage ? usage.usedBytes / Math.max(usage.limitBytes, 1) : 0
  const usagePercent = Math.min(100, usageRatio * 100)
  const usageTone = usageRatio >= 0.9 ? ' is-alert' : usageRatio >= 0.8 ? ' is-warn' : ''

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
          <section className="menu-section" aria-labelledby="menu-data">
            <h3 id="menu-data">DADOS</h3>
            <div className="menu-instructions">
              <p>
                O aplicativo foi preparado para suportar até 10GB de fotos e videos. Caso o espaço
                seja consumido, você precisa excluir dados. Não é possivel estender este espaço
                gratuitamente.
              </p>
              <p>
                Até agora você usou:
                <br />
                <strong>{usageLabel}</strong>.
              </p>
              {usage ? (
                <div
                  className="menu-usage"
                  role="progressbar"
                  aria-label="Consumo de armazenamento"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(usagePercent)}
                >
                  <span
                    className={`menu-usage__fill${usageTone}`}
                    style={{
                      width:
                        usage.usedBytes > 0 ? `max(6px, ${usagePercent}%)` : '0%',
                    }}
                  />
                </div>
              ) : null}
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
              <div className="menu-about__license" onClick={tapLicense}>
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
      {licenseEgg ? (
        <div className="sheet egg-photo-sheet" onClick={() => setLicenseEgg(false)}>
          <div
            className="sheet__card egg-photo-card"
            role="dialog"
            aria-modal="true"
            aria-label="Easter egg"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={easterEgg1} alt="Parabéns você achou um Easter Egg" />
            <button type="button" className="btn btn-primary" onClick={() => setLicenseEgg(false)}>
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function SearchBar() {
  const { query, setQuery } = usePlantSearch()
  const { barrelRoll } = useEaster()
  const rolled = useRef(false)

  return (
    <label className="search-bar">
      <input
        type="search"
        value={query}
        placeholder="Pesquisar"
        aria-label="Pesquisar plantas"
        onChange={(event) => {
          const value = event.target.value
          setQuery(value)
          if (isBarrelRollQuery(value)) {
            if (!rolled.current) {
              rolled.current = true
              barrelRoll()
            }
          } else {
            rolled.current = false
          }
        }}
      />
    </label>
  )
}

export function BottomNav() {
  const location = useLocation()
  const { refreshPlants } = usePlants()
  const [pickerOpen, setPickerOpen] = useState(false)
  const identifyActive = location.pathname === '/identificar'
  const identifyDisabled = location.pathname === '/nova'

  return (
    <>
      <nav className="bottom-nav" aria-label="Principal">
        <NavLink to="/" end aria-label="Galeria" onClick={() => void refreshPlants()}>
          <GridIcon />
        </NavLink>
        <button
          type="button"
          className={`bottom-nav__identify${identifyActive ? ' is-active' : ''}${identifyDisabled ? ' is-disabled' : ''}`}
          aria-label="Identificar espécie"
          aria-expanded={pickerOpen}
          disabled={identifyDisabled}
          onClick={() => {
            if (identifyDisabled) return
            setPickerOpen(true)
          }}
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
