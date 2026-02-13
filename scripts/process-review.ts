#!/usr/bin/env node
import { readFile, writeFile, access } from 'fs/promises'
import { parse, stringify } from 'yaml'
import { join } from 'path'
import { slugify, getClassification, parseGenre } from '../src/utils/helpers.js'

const ROOT = join(import.meta.dirname, '..')

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function ensureArtist(
  artistName: string,
  genre: string,
  language: string,
  country?: string
): Promise<string> {
  const slug = slugify(artistName)
  const artistPath = join(ROOT, 'src/content/artists', `${slug}.json`)
  
  if (await fileExists(artistPath)) {
    console.log(`Artist exists: ${slug}`)
    return slug
  }
  
  const artistData: Record<string, any> = {
    name: artistName,
    slug: slug,
    genre: parseGenre(genre),
    language: language,
    country: country || undefined,
  }
  
  Object.keys(artistData).forEach(key => 
    artistData[key] === undefined && delete artistData[key]
  )
  
  await writeFile(artistPath, JSON.stringify(artistData, null, 2) + '\n')
  console.log(`Created artist: ${slug}`)
  
  return slug
}

async function ensureAlbum(
  albumTitle: string,
  artistId: string,
  year: string,
  genre?: string
): Promise<string> {
  const slug = slugify(albumTitle)
  const albumPath = join(ROOT, 'src/content/albums', `${slug}.json`)
  
  if (await fileExists(albumPath)) {
    console.log(`Album exists: ${slug}`)
    return slug
  }
  
  const albumData: Record<string, any> = {
    title: albumTitle,
    artist_id: artistId,
    year: year,
    genre: genre ? parseGenre(genre) : undefined,
  }
  
  Object.keys(albumData).forEach(key => 
    albumData[key] === undefined && delete albumData[key]
  )
  
  await writeFile(albumPath, JSON.stringify(albumData, null, 2) + '\n')
  console.log(`Created album: ${slug}`)
  
  return slug
}

async function processReview(reviewPath: string): Promise<void> {
  console.log(`\n📄 Processing: ${reviewPath}`)
  
  const content = await readFile(reviewPath, 'utf-8')
  const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/)
  
  if (!match) {
    throw new Error('Invalid frontmatter format')
  }
  
  const [, frontmatterText, markdownContent] = match
  const frontmatter: any = parse(frontmatterText)
  
  const { artist, album, year, genre, language } = frontmatter
  
  if (!artist) {
    throw new Error('Missing artist in frontmatter')
  }
  
  if (!album || album.toLowerCase() === 'unknown') {
    console.log('⚠ No album specified, skipping album creation')
  }

  let country: string | undefined
  if (language === 'Portuguese') country = 'Brazil'
  else if (language === 'English') country = 'USA'
  else if (language === 'French') country = 'France'
  
  const artistId = await ensureArtist(artist, genre, language, country)
  
  let albumId: string | undefined
  if (album && album.toLowerCase() !== 'unknown') {
    albumId = await ensureAlbum(album, artistId, year, genre)
  }
  
  delete frontmatter.artist
  delete frontmatter.album
  delete frontmatter.year
  delete frontmatter.genre
  delete frontmatter.language
  delete frontmatter.weights
  delete frontmatter.weighted_scores
  delete frontmatter.weighted_sum
  delete frontmatter.calculated_final_score
  delete frontmatter.classification  // Will be calculated on-demand
  
  // Fill analyzed_at with current ISO datetime if empty
  if (!frontmatter.analyzed_at || frontmatter.analyzed_at === '') {
    frontmatter.analyzed_at = new Date().toISOString()
  }
  // Convert date-only to datetime if needed
  else if (/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.analyzed_at)) {
    frontmatter.analyzed_at = new Date(frontmatter.analyzed_at).toISOString()
  }
  
  const newFrontmatter: Record<string, any> = {
    song: frontmatter.song,
    artist_id: artistId,
    album_id: albumId || undefined,
    analyzed_at: frontmatter.analyzed_at,
    cynicism_level: frontmatter.cynicism_level,
    model_used: frontmatter.model_used,
    final_score: frontmatter.final_score,
    scores: frontmatter.scores,
    texts: frontmatter.texts,
    strongest_verse: frontmatter.strongest_verse,
    strengths: frontmatter.strengths,
    weaknesses: frontmatter.weaknesses,
    essential_for: frontmatter.essential_for,
    similar_to: frontmatter.similar_to,
  }
  
  Object.keys(newFrontmatter).forEach(key => 
    newFrontmatter[key] === undefined && delete newFrontmatter[key]
  )
  
  const newFrontmatterText = stringify(newFrontmatter, {
    lineWidth: 0,
    indent: 4,
  })
  
  const newContent = `---\n${newFrontmatterText}---\n${markdownContent}`
  
  await writeFile(reviewPath, newContent, 'utf-8')
  
  console.log(`Converted successfully!`)
  console.log(`   artist_id: ${artistId}`)
  console.log(`   album_id: ${albumId}`)
}

const reviewPath = process.argv[2]

if (!reviewPath) {
  console.error('Usage: tsx process-review.ts <path-to-review.md>')
  console.error('Example: pnpm process-review src/content/reviews/tool/new-song.md')
  process.exit(1)
}

processReview(reviewPath)
  .then(() => console.log('\n✨ Done!'))
  .catch(error => {
    console.error('\n Error:', error.message)
    process.exit(1)
  })
