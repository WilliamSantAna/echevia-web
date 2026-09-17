import { FavoritesStrip } from '../components/FavoritesStrip'
import { PhotoGrid } from '../components/PhotoGrid'
import { usePlantSearch } from '../lib/search'
import { usePlants } from '../store/plants'

export function GalleryPage() {
  const { plants } = usePlants()
  const { query, filterPlants } = usePlantSearch()
  const filtered = filterPlants(plants)

  return (
    <>
      <FavoritesStrip plants={plants} />
      <PhotoGrid
        plants={filtered}
        emptyTitle={query ? 'Nenhum resultado' : 'Sua coleção está vazia'}
        emptyText={
          query
            ? 'Tente outro nome.'
            : 'Toque em Nova para fotografar a primeira suculenta.'
        }
      />
    </>
  )
}