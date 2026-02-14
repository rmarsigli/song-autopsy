#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { slugify, createFrontmatter } from './lib/utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrateAlbums() {
  const albumsDir = path.join(__dirname, '../src/content/albums')
  
  console.log('🔄 Starting album migration from JSON to Markdown...\n')
  
  const files = await fs.readdir(albumsDir)
  const jsonFiles = files.filter(f => f.endsWith('.json'))
  
  console.log(`📋 Found ${jsonFiles.length} JSON files to migrate`)
  
  let migrated = 0
  let skipped = 0
  
  for (const file of jsonFiles) {
    const filePath = path.join(albumsDir, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const albumData = JSON.parse(content)
    
    const artistSlug = albumData.artist_id
    const albumSlug = path.basename(file, '.json')
    
    const artistDir = path.join(albumsDir, artistSlug)
    await fs.mkdir(artistDir, { recursive: true })
    
    const frontmatter = createFrontmatter({
      title: albumData.title,
      artist_id: albumData.artist_id,
      year: albumData.year,
      genre: albumData.genre || [],
      ...(albumData.cover_art && { cover_art: albumData.cover_art })
    })
    
    const mdContent = `# ${albumData.title}\n\n*Album review content will be generated after all songs are analyzed.*\n`
    const mdFilePath = path.join(artistDir, `${albumSlug}.md`)
    
    const exists = await fs.access(mdFilePath).then(() => true).catch(() => false)
    
    if (exists) {
      console.log(`   ⏭️  Skipped: ${artistSlug}/${albumSlug}.md (already exists)`)
      skipped++
    } else {
      await fs.writeFile(mdFilePath, frontmatter + '\n' + mdContent)
      console.log(`   ✓ Migrated: ${artistSlug}/${albumSlug}.md`)
      migrated++
    }
  }
  
  console.log(`\n✅ Migration complete!`)
  console.log(`   📦 Migrated: ${migrated} albums`)
  console.log(`   ⏭️  Skipped: ${skipped} albums (already existed)`)
  console.log(`\n💡 You can now delete the old .json files if everything looks good.`)
}

migrateAlbums().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
