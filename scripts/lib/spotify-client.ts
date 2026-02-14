import 'dotenv/config'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET!

let cachedToken: string | null = null
let tokenExpiry: number | null = null

interface SpotifyImage {
  url: string
  height: number
  width: number
}

export interface SpotifyArtist {
  id: string
  name: string
  genres?: string[]
  images?: SpotifyImage[]
  followers?: { total: number }
  external_urls: { spotify: string }
}

export interface SpotifyAlbum {
  id: string
  name: string
  release_date: string
  album_type: string
  images: SpotifyImage[]
  external_urls: { spotify: string }
}

export interface SpotifyTrack {
  id: string
  name: string
  track_number: number
  duration_ms: number
  external_urls: { spotify: string }
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_SECRET}`).toString('base64')
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000

  return cachedToken!
}

export async function searchArtist(artistName: string): Promise<SpotifyArtist[]> {
  const token = await getAccessToken()
  
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=5`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )

  const data = await response.json()
  return data.artists.items
}

export async function getArtistAlbums(artistId: string): Promise<SpotifyAlbum[]> {
  const token = await getAccessToken()
  const allAlbums: SpotifyAlbum[] = []
  let offset = 0
  const limit = 10  // Spotify's maximum limit
  
  while (true) {
    const url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&offset=${offset}&limit=${limit}`
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`   API Response: ${errorBody}`)
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const items: SpotifyAlbum[] = data.items || []
    
    allAlbums.push(...items)
    
    // Stop if we got less than limit or if there's no next page
    if (items.length < limit || !data.next) {
      break
    }
    
    offset += limit
  }

  return allAlbums
}

export async function getAlbumTracks(albumId: string) {
  const token = await getAccessToken()
  const allTracks: SpotifyTrack[] = []
  let url: string | null = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`

  while (url) {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`   API Response: ${errorBody}`)
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const items: SpotifyTrack[] = data.items || []
    allTracks.push(...items)
    url = data.next
  }
  
  // We need to fetch album details separately to get genres and release date
  // since tracks endpoint doesn't return them
  const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
     headers: { 'Authorization': `Bearer ${token}` }
  })
  const albumData = await albumResponse.json()

  return {
    name: albumData.name,
    releaseDate: albumData.release_date,
    genres: albumData.genres || [],
    external_urls: albumData.external_urls,
    images: albumData.images,
    tracks: allTracks.map(track => ({
      id: track.id,
      name: track.name,
      trackNumber: track.track_number,
      duration: track.duration_ms,
      external_urls: track.external_urls
    }))
  }
}
