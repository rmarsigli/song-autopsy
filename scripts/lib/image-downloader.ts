import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PUBLIC_DIR = path.join(__dirname, '../../public')

/**
 * Downloads an image from a URL and saves it to the public directory
 * @param url Image URL to download
 * @param relativePath Path relative to public directory (e.g. 'covers/artist/album.jpg')
 * @returns The public URL path (e.g. '/covers/artist/album.jpg')
 */
export async function downloadImage(url: string, relativePath: string): Promise<string> {
  const fullPath = path.join(PUBLIC_DIR, relativePath)
  const dir = path.dirname(fullPath)
  
  await fs.mkdir(dir, { recursive: true })
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${res.statusCode}`))
        return
      }
      
      const chunks: any[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', async () => {
        const buffer = Buffer.concat(chunks) as unknown as Uint8Array
        await fs.writeFile(fullPath, buffer)
        resolve('/' + relativePath)
      })
    }).on('error', reject)
  })
}
