#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function fixAlbumPaths() {
  console.log('🔍 Detecting album path inconsistencies...\n')
  
  const reviewsDir = path.join(__dirname, '../src/content/reviews')
  const albumsDir = path.join(__dirname, '../src/content/albums')
  
  // Recursively find all review .md files
  async function findReviews(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files: string[] = []
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        files.push(...await findReviews(fullPath))
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
    
    return files
  }
  
  const reviewFiles = await findReviews(reviewsDir)
  console.log(`📖 Found ${reviewFiles.length} review files\n`)
  
  // Group reviews by album_id to find the correct artist_id
  const albumUsage: Record<string, { artistId: string, count: number }> = {}
  
  for (const reviewFile of reviewFiles) {
    const content = await fs.readFile(reviewFile, 'utf-8')
    const { data } = matter(content)
    
    const albumId = data.album_id
    const artistId = data.artist_id
    
    if (!albumId || !artistId) continue
    
    if (!albumUsage[albumId]) {
      albumUsage[albumId] = { artistId, count: 0 }
    }
    albumUsage[albumId].count++
  }
  
  console.log(`📊 Found ${Object.keys(albumUsage).length} unique albums in reviews\n`)
  
  // Recursively find all .md files in albums directory
  async function findAlbumFiles(dir: string, basePath: string = ''): Promise<Array<{ path: string, relativePath: string }>> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files: Array<{ path: string, relativePath: string }> = []
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relPath = basePath ? `${basePath}/${entry.name}` : entry.name
      
      if (entry.isDirectory()) {
        files.push(...await findAlbumFiles(fullPath, relPath))
      } else if (entry.name.endsWith('.md')) {
        files.push({ path: fullPath, relativePath: relPath })
      }
    }
    
    return files
  }
  
  const albumFiles = await findAlbumFiles(albumsDir)
  console.log(`📁 Found ${albumFiles.length} album markdown files\n`)
  
  let moved = 0
  let errors = 0
  
  for (const file of albumFiles) {
    // Extract artist/album from current path
    const parts = file.relativePath.split('/')
    if (parts.length !== 2) continue
    
    const [currentArtistDir, albumFile] = parts
    const albumSlug = path.basename(albumFile, '.md')
    
    // Check if this album is used in reviews
    const usage = albumUsage[albumSlug]
    
    if (!usage) {
      console.log(`   ⚠️  Album ${albumSlug} not found in any reviews (in ${currentArtistDir}/)`)
      continue
    }
    
    const correctArtistId = usage.artistId
    
    if (currentArtistDir === correctArtistId) {
      // Already in correct location
      continue
    }
    
    console.log(`   🔄 Moving: ${currentArtistDir}/${albumSlug}.md → ${correctArtistId}/${albumSlug}.md`)
    
    try {
      const correctDir = path.join(albumsDir, correctArtistId)
      await fs.mkdir(correctDir, { recursive: true })
      
      const newPath = path.join(correctDir, `${albumSlug}.md`)
      await fs.rename(file.path, newPath)
      
      moved++
      console.log(`      ✅ Moved successfully`)
    } catch (error) {
      errors++
      console.error(`      ❌ Error moving: ${error}`)
    }
  }
  
  // Clean up empty directories
  console.log(`\n🧹 Cleaning up empty directories...`)
  const artistDirs = await fs.readdir(albumsDir, { withFileTypes: true })
  
  for (const dir of artistDirs) {
    if (!dir.isDirectory()) continue
    
    const dirPath = path.join(albumsDir, dir.name)
    const contents = await fs.readdir(dirPath)
    
    if (contents.length === 0) {
      await fs.rmdir(dirPath)
      console.log(`   🗑️  Removed empty directory: ${dir.name}/`)
    }
  }
  
  console.log(`\n✅ Album path fix complete!`)
  console.log(`   📦 Moved: ${moved} albums`)
  console.log(`   ❌ Errors: ${errors}`)
  
  if (moved > 0) {
    console.log(`\n💡 Run 'pnpm build' to verify everything works!`)
  }
}

fixAlbumPaths().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
