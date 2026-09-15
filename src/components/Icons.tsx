type IconProps = {
  className?: string
}

export function PencilIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  )
}

export function SearchIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  )
}

export function GridIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function VideosIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="4" />
      <path d="M10 9.5 16 12l-6 2.5v-5Z" />
    </svg>
  )
}

export function HeartIcon({ className = 'icon', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  )
}

export function PlusIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function BackIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5 8 12l7 7" />
    </svg>
  )
}

export function MenuIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function ShareIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 3.4M15.4 7.1 8.6 10.5" />
    </svg>
  )
}

export function TrashIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function StarIcon({ className = 'icon', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 19.8l1-6.1L3.2 9.4l6.1-.9L12 3Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  )
}

export function CameraIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

export function PhotoIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m5 17 4.2-4.8 3.3 3.4 2.4-2.6L19 17" />
    </svg>
  )
}

export function MuteIcon({ className = 'icon', muted = true }: IconProps & { muted?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10v4h4l5 4V6L8 10H4Z" />
      {muted ? <path d="m16 9 5 6M21 9l-5 6" /> : <path d="M16 8.5a6 6 0 0 1 0 7" />}
    </svg>
  )
}

export function IdentifyIcon({ className = 'icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h3M5 5v3M19 5h-3M19 5v3M5 19h3M5 19v-3M19 19h-3M19 19v-3" />
      <path d="M12 18c4.8-2 6.8-6.4 6.8-11.4-4.8.8-8.6 2.8-10.6 7.4 1.8.9 2.9 2.4 3.8 4Z" />
      <path d="M10.2 10.4c.5 1.9 1.6 3.4 3.2 4.4" />
    </svg>
  )
}
