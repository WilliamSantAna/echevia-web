import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav, MenuDrawer, SearchBar, TopBar } from './components/Chrome'
import { EasterFX } from './components/EasterFX'
import { InstallBanner } from './components/InstallBanner'
import { useEaster } from './store/easter'

export function AppLayout() {
  const location = useLocation()
  const showSearch = location.pathname === '/'
  const [menuOpen, setMenuOpen] = useState(false)
  const { rolling, party } = useEaster()

  return (
    <div className={`app-shell${rolling ? ' is-rolling' : ''}${party ? ' is-party' : ''}`}>
      <div className="chrome-top">
        <TopBar menuOpen={menuOpen} onMenuOpen={() => setMenuOpen(true)} />
        {showSearch ? <SearchBar /> : null}
      </div>
      <main className="main">
        <Outlet />
      </main>
      <InstallBanner />
      <BottomNav />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <EasterFX />
    </div>
  )
}
