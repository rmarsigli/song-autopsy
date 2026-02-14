import 'dotenv/config'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET!

let cachedToken: string | null = null
let tokenExpiry: number | null = null

interface SpotifyArtist {
  id: string
  name: string
  genres?: string[]
  followers?: { total: number }
}

interface SpotifyAlbum {
  id: string
  name: string
  release_date: string
  album_type: string
}

interface SpotifyTrack {
  name: string
  track_number: number
  duration_ms: number
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
  
  const response = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )

  const data = await response.json()
  return {
    name: data.name,
    releaseDate: data.release_date,
    genres: data.genres || [],
    tracks: (data.tracks.items as SpotifyTrack[]).map(track => ({
      name: track.name,
      trackNumber: track.track_number,
      duration: track.duration_ms
    }))
  }
}
