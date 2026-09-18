import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { shouldShowInstallPage } from './lib/install'
import { EditPlantPage } from './pages/EditPlantPage'
import { GalleryPage } from './pages/GalleryPage'
import { NewPlantPage } from './pages/NewPlantPage'
import { IdentifyPage } from './pages/IdentifyPage'
import { InstallPage } from './pages/InstallPage'
import { LegalPage } from './pages/LegalPage'
import { PlantDetailPage } from './pages/PlantDetailPage'
import { VideosPage } from './pages/VideosPage'
import { SharePage } from './pages/SharePage'

export default function App() {
  const location = useLocation()
  const [showInstall] = useState(shouldShowInstallPage)
  const isShare = location.pathname.startsWith('/p/')

  if (showInstall && !isShare) {
    return <InstallPage />
  }

  return (
    <Routes>
      <Route path="/p/:identification" element={<SharePage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<GalleryPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/reels" element={<Navigate to="/videos" replace />} />
        <Route path="/favoritos" element={<Navigate to="/" replace />} />
        <Route path="/nova" element={<NewPlantPage />} />
        <Route path="/identificar" element={<IdentifyPage />} />
        <Route path="/plantas/:id" element={<PlantDetailPage />} />
        <Route path="/plantas/:id/editar" element={<EditPlantPage />} />
        <Route path="/legal/:slug" element={<LegalPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
