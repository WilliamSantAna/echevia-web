import { VideoFeed } from '../components/VideoFeed'
import { usePlants } from '../store/plants'

export function VideosPage() {
  const { plants } = usePlants()
  return <VideoFeed plants={plants} />
}
