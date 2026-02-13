import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFile, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'url'
import { execSync } from 'child_process'
import { generateReview, slugify, saveReview, type ReviewInput } from '../scripts/generate-reviews.js'
import type { ReviewRequest, ReviewResponse, ServerConfig } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export class ReviewServer {
  private server: ReturnType<typeof createServer>
  private config: ServerConfig

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = {
      port: config.port ?? 3000,
      autoOpen: config.autoOpen ?? true,
      host: config.host ?? 'localhost',
    }

    this.server = createServer(this.handleRequest.bind(this))
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const parsedUrl = parse(req.url || '', true)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    if (parsedUrl.pathname === '/' && req.method === 'GET') {
      await this.serveIndex(res)
    } else if (parsedUrl.pathname === '/styles.css' && req.method === 'GET') {
      await this.serveStatic(res, 'styles.css', 'text/css')
    } else if (parsedUrl.pathname === '/client.js' && req.method === 'GET') {
      await this.serveStatic(res, 'client.js', 'application/javascript')
    } else if (parsedUrl.pathname === '/api/artists' && req.method === 'GET') {
      await this.handleArtists(res)
    } else if (parsedUrl.pathname === '/api/albums' && req.method === 'GET') {
      await this.handleAlbums(res)
    } else if (parsedUrl.pathname === '/generate' && req.method === 'POST') {
      await this.handleGenerate(req, res)
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
    }
  }

  private async serveIndex(res: ServerResponse): Promise<void> {
    await this.serveStatic(res, 'index.html', 'text/html')
  }

  private async serveStatic(res: ServerResponse, filename: string, contentType: string): Promise<void> {
    try {
      const filePath = join(__dirname, filename)
      console.log(`\x1b[36m[DEBUG]\x1b[0m Serving ${filename} from ${filePath}`)
      const content = await readFile(filePath, 'utf-8')
      console.log(`\x1b[32m[OK]\x1b[0m File ${filename} loaded (${content.length} bytes)`)
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    } catch (error) {
      console.error(`\x1b[31m[ERROR]\x1b[0m serving ${filename}:`, error)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal Server Error')
    }
  }

  private async handleArtists(res: ServerResponse): Promise<void> {
    try {
      const artistsDir = join(process.cwd(), 'src/content/artists')
      const files = await readdir(artistsDir)
      const artists = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async (file) => {
            const content = await readFile(join(artistsDir, file), 'utf-8')
            const data = JSON.parse(content)
            return data.name
          })
      )
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(artists.sort()))
    } catch (error) {
      console.error(`\x1b[31m[ERROR]\x1b[0m loading artists:`, error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify([]))
    }
  }

  private async handleAlbums(res: ServerResponse): Promise<void> {
    try {
      const albumsDir = join(process.cwd(), 'src/content/albums')
      const files = await readdir(albumsDir)
      const albums = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async (file) => {
            const content = await readFile(join(albumsDir, file), 'utf-8')
            const data = JSON.parse(content)
            return data.title
          })
      )
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(albums.sort()))
    } catch (error) {
      console.error(`\x1b[31m[ERROR]\x1b[0m loading albums:`, error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify([]))
    }
  }

  private async handleGenerate(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const data = await this.parseBody(req)

      this.validateRequest(data)

      console.log(`\n\x1b[36m>> Generating review for: ${data.artist} - ${data.song}\x1b[0m`)

      const input: ReviewInput = {
        artist: data.artist.trim(),
        song: data.song.trim(),
        album: data.album?.trim(),
        language: data.language,
        cynicism: data.cynicism,
        lyrics: data.lyrics.trim(),
      }

      const reviewResult = await generateReview(input)

      const artistSlug = slugify(input.artist)
      const songSlug = slugify(input.song)
      const filepath = await saveReview(artistSlug, songSlug, reviewResult.content)

      console.log('  Processing with conversion script...')
      execSync(`tsx scripts/process-review.ts ${filepath}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      })

      const response: ReviewResponse = {
        success: true,
        message: 'Review created successfully!',
        filepath: filepath,
        artist: data.artist,
        song: data.song,
        album: data.album,
        artist_slug: artistSlug,
        song_slug: songSlug,
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(response))

      console.log(`\x1b[32m[SUCCESS]\x1b[0m File: ${filepath}\n`)
    } catch (error: any) {
      console.error(`\x1b[31m[ERROR]\x1b[0m`, error.message)

      const response: ReviewResponse = {
        success: false,
        error: error.message,
        details: error.stack,
      }

      res.writeHead(error.message.includes('required') ? 400 : 500, {
        'Content-Type': 'application/json',
      })
      res.end(JSON.stringify(response))
    }
  }

  private async parseBody(req: IncomingMessage): Promise<ReviewRequest> {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', (chunk) => (body += chunk.toString()))
      req.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (error) {
          reject(new Error('Invalid JSON'))
        }
      })
      req.on('error', reject)
    })
  }

  private validateRequest(data: ReviewRequest): void {
    if (!data.artist?.trim()) {
      throw new Error('Artist name is required')
    }
    if (!data.song?.trim()) {
      throw new Error('Song title is required')
    }
    if (!data.lyrics?.trim()) {
      throw new Error('Lyrics are required')
    }
    if (!data.language) {
      throw new Error('Language is required')
    }
    if (typeof data.cynicism !== 'number' || data.cynicism < 0 || data.cynicism > 10) {
      throw new Error('Cynicism must be a number between 0 and 10')
    }
  }

  public start(): void {
    this.server.listen(this.config.port, this.config.host, () => {
      const url = `http://${this.config.host}:${this.config.port}`
      
      console.log(`\n\x1b[1m\x1b[35mLyrics Review Generator\x1b[0m`)
      console.log(`\x1b[36m[SERVER]\x1b[0m Running at: \x1b[4m${url}\x1b[0m`)
      console.log(`\n\x1b[33m[INFO]\x1b[0m Open the URL above in your browser to start generating reviews`)
      console.log(`\x1b[2m[CTRL+C]\x1b[0m Press Ctrl+C to stop\n`)

      if (this.config.autoOpen) {
        this.openBrowser(url)
      }
    })

    process.on('SIGINT', () => {
      console.log('\n\n\x1b[33m[SHUTDOWN]\x1b[0m Shutting down server...')
      this.server.close(() => {
        console.log('\x1b[32m[STOPPED]\x1b[0m Server stopped\n')
        process.exit(0)
      })
    })
  }

  private openBrowser(url: string): void {
    const start =
      process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'

    try {
      execSync(`${start} ${url}`, { stdio: 'ignore' })
    } catch (error) {
      // Ignore errors from auto-open
    }
  }
}
