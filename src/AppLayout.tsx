import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav, MenuDrawer, SearchBar, TopBar } from './components/Chrome'
import { InstallBanner } from './components/InstallBanner'

export function AppLayout() {
  const location = useLocation()
  const showSearch = location.pathname === '/'
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app-shell">
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
    </div>
  )
}
