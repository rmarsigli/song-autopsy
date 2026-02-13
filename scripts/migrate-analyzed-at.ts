#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { parse, stringify } from 'yaml'

const REVIEWS_DIR = join(import.meta.dirname, '../src/content/reviews')

async function getAllReviews(dir: string): Promise<string[]> {
  const files: string[] = []
  
  async function scan(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await scan(fullPath)
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }
  
  await scan(dir)
  return files
}

async function migrateReview(filepath: string): Promise<boolean> {
  const content = await readFile(filepath, 'utf-8')
  const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/)
  
  if (!match) {
    console.log(`⚠️  Skipping ${filepath} - invalid frontmatter`)
    return false
  }
  
  const [, frontmatterText, markdownContent] = match
  const frontmatter: any = parse(frontmatterText)
  
  if (!frontmatter.analyzed_at) {
    console.log(`⚠️  Skipping ${filepath} - no analyzed_at field`)
    return false
  }
  
  // Check if it's date-only format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.analyzed_at)) {
    // Convert to ISO datetime (use noon to avoid timezone issues)
    const date = new Date(frontmatter.analyzed_at + 'T12:00:00Z')
    frontmatter.analyzed_at = date.toISOString()
    
    // Remove classification if exists (will be calculated)
    if (frontmatter.classification) {
      delete frontmatter.classification
    }
    
    const newFrontmatterText = stringify(frontmatter, {
      lineWidth: 0,
      indent: 4,
    })
    
    const newContent = `---\n${newFrontmatterText}---\n${markdownContent}`
    await writeFile(filepath, newContent, 'utf-8')
    
    const filename = filepath.split('/').pop()
    console.log(`✅ Migrated: ${filename}`)
    return true
  }
  
  return false
}

async function main() {
  console.log('🔄 Starting migration of analyzed_at dates...\n')
  
  const reviewFiles = await getAllReviews(REVIEWS_DIR)
  console.log(`Found ${reviewFiles.length} review files\n`)
  
  let migrated = 0
  let skipped = 0
  
  for (const file of reviewFiles) {
    const result = await migrateReview(file)
    if (result) migrated++
    else skipped++
  }
  
  console.log(`\n✨ Migration complete!`)
  console.log(`   Migrated: ${migrated}`)
  console.log(`   Skipped:  ${skipped}`)
}

main().catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
