#!/usr/bin/env node
import 'dotenv/config'
import { searchArtist, getArtistAlbums, getAlbumTracks } from './lib/spotify-client.js'
import { slugify, createFrontmatter } from './lib/utils.js'
import { downloadImage } from './lib/image-downloader.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve))
}

async function main() {
  const artistName = process.argv[2]

  if (!artistName) {
    console.error('❌ Usage: pnpm generate:albums "Artist Name"')
    process.exit(1)
  }

  console.log(`🔍 Searching for artist: ${artistName}...`)
  
  const artists = await searchArtist(artistName)

  if (artists.length === 0) {
    console.error('❌ No artists found')
    process.exit(1)
  }

  console.log('\n📋 Found artists:')
  artists.forEach((artist, i) => {
    const genres = artist.genres && artist.genres.length > 0 ? artist.genres.join(', ') : 'No genre'
    const followers = artist.followers?.total?.toLocaleString() || '0'
    console.log(`  ${i + 1}. ${artist.name} (${genres}) - ${followers} followers`)
  })

  const choice = await question(`\n👉 Select artist (1-${artists.length}): `)
  const selectedArtist = artists[parseInt(choice) - 1]

  if (!selectedArtist) {
    console.error('❌ Invalid selection')
    process.exit(1)
  }

  console.log(`\n✅ Selected: ${selectedArtist.name}`)
  console.log(`🎵 Fetching all albums (this may take a moment)...`)

  const albums = await getArtistAlbums(selectedArtist.id)
  
  if (albums.length === 0) {
    console.error('❌ No albums found')
    process.exit(1)
  }
  
  console.log(`\n📀 Found ${albums.length} albums:`)
  albums.forEach((album, i) => {
    console.log(`  ${i + 1}. ${album.name} (${album.release_date.substring(0, 4)})`)
  })

  const albumChoice = await question(`\n👉 Select albums (comma-separated, or "all"): `)
  
  let selectedAlbums
  if (albumChoice.toLowerCase() === 'all') {
    selectedAlbums = albums
  } else {
    const indices = albumChoice.split(',').map(s => parseInt(s.trim()) - 1)
    selectedAlbums = indices.map(i => albums[i]).filter(Boolean)
  }

  console.log(`\n⚙️  Processing ${selectedAlbums.length} album(s)...`)

  const artistSlug = slugify(selectedArtist.name)
  const artistDir = path.join(__dirname, '../src/content/albums', artistSlug)
  
  await fs.mkdir(artistDir, { recursive: true })

  for (const album of selectedAlbums) {
    console.log(`\n   📀 ${album.name}...`)
    
    const albumDetails = await getAlbumTracks(album.id)
    const albumSlug = slugify(album.name)
    
    // Download cover art
    let coverImage = ''
    if (albumDetails.images && albumDetails.images.length > 0) {
      // Try to find 300x300 or closest, otherwise take first
      const image = albumDetails.images.find(img => img.height === 300) || albumDetails.images[0]
      if (image.url) {
        try {
          const relativePath = `covers/${artistSlug}/${albumSlug}.jpg`
          console.log(`      ⬇️  Downloading cover art...`)
          coverImage = await downloadImage(image.url, relativePath)
        } catch (e) {
          console.error(`      ⚠️  Failed to download cover: ${e}`)
        }
      }
    }

    const frontmatter = createFrontmatter({
      title: albumDetails.name,
      artist_id: artistSlug,
      year: album.release_date.substring(0, 4),
      genre: albumDetails.genres.length > 0 ? albumDetails.genres : selectedArtist.genres || [],
      cover_image: coverImage,
      spotify_id: album.id,
      spotify_url: albumDetails.external_urls.spotify,
      songs: albumDetails.tracks.map(track => ({
        slug: slugify(track.name),
        name: track.name,
        spotify_id: track.id
      }))
    })

    const content = `# ${albumDetails.name}\n\n*Album review content will be generated after all songs are analyzed.*\n`
    const filePath = path.join(artistDir, `${albumSlug}.md`)
    
    await fs.writeFile(filePath, frontmatter + '\n' + content)
    console.log(`      ✓ Created: ${filePath.replace(__dirname + '/../', '')}`)
  }

  console.log(`\n✅ Done! Generated ${selectedAlbums.length} album(s) for ${selectedArtist.name}`)
  rl.close()
}

main().catch(error => {
  console.error('❌ Error:', error)
  rl.close()
  process.exit(1)
})
