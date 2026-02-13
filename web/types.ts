export interface ReviewRequest {
  artist: string
  song: string
  album?: string
  language: string
  cynicism: number
  lyrics: string
}

export interface ReviewResponse {
  success: boolean
  message?: string
  filepath?: string
  artist?: string
  song?: string
  album?: string
  artist_slug?: string
  song_slug?: string
  error?: string
  details?: string
}

export interface ServerConfig {
  port: number
  autoOpen: boolean
  host: string
}
