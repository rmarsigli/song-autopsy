#!/usr/bin/env node
import 'dotenv/config'
import { readFile, writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import prompts from 'prompts'
import { spawnSync } from 'child_process'
import { getRandomSeeds } from '../src/config/seeds'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
}

const log = {
  info: (msg: string) => console.log(`${colors.cyan}${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}${msg}${colors.reset}`),
  dim: (msg: string) => console.log(`${colors.dim}${msg}${colors.reset}`),
  title: (msg: string) => console.log(`${colors.bright}${colors.magenta}${msg}${colors.reset}`),
}

const CONFIG = {
  defaultAgent: (process.env.DEFAULT_AGENT || 'gemini') as 'gemini' | 'chat-gpt',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3-pro-preview',
  },
  openai: {
    apiKey: process.env.CHAT_GPT_API_KEY || '',
    model: process.env.CHAT_GPT_MODEL || 'gpt-5.2-2025-12-11',
  },
  outputDir: 'src/content/reviews',
  processScriptPath: 'scripts/process-review.ts',
  defaultCynicism: 5,
}

const SYSTEM_PROMPT = `# Song Lyrics Critical Analysis

## MODE: MARKDOWN_ARTIFACT_ONLY

### HARD CONSTRAINTS

You must output **only one Markdown document**.

You must not:
- Add commentary before the document
- Add commentary after the document
- Wrap the document in code fences
- Output JSON
- Explain your reasoning
- Apologize
- Add notes

If any rule is violated, the output is invalid.

---

## CONFIGURATION

\`\`\`yaml
cynicism_level: {{CYNICISM_LEVEL}}
output_language: auto
decimal_precision: 1
\`\`\`

- \`cynicism_level\` controls tonal sharpness (0–10).
- \`decimal_precision\` must be respected consistently.
- \`output_language: auto\` = detect original song language for the ESSAY BODY, but metadata remains as provided.

---

# STRUCTURE CONTRACT (NON-NEGOTIABLE)

The response must begin **exactly** with:

\`\`\`
---
\`\`\`

And must end with the final section of the Markdown document.  
No trailing commentary.
No blank line between closing --- and H1

---

## REQUIRED DOCUMENT TEMPLATE

The document must follow this exact order:

\`\`\`markdown
---
song: ""
artist: ""
album: ""
year: ""
genre: ""
language: ""
analyzed_at: ""
cynicism_level: 0
model_used: ""

final_score: 0.0

scores:
  emotional_impact: 0.0
  thematic_depth: 0.0
  narrative_structure: 0.0
  linguistic_technique: 0.0
  imagery: 0.0
  originality: 0.0

texts:
  emotional_impact: ""
  thematic_depth: ""
  narrative_structure: ""
  linguistic_technique: ""
  imagery: ""
  originality: ""

strongest_verse: ""
strengths: []
weaknesses: []
essential_for: []
similar_to: []
---
# Lyrics Review and Analysis for {song}, by {artist}

(Body begins immediately here)
\`\`\`

No sections may be reordered.  
No keys may be renamed.  
No keys may be removed.  
No extra keys may be added.

---

# SCORING METHODOLOGY

Weights used internally for final_score calculation:
- emotional_impact: 25%
- thematic_depth: 20%
- narrative_structure: 15%
- linguistic_technique: 15%
- imagery: 15%
- originality: 10%

Final score formula:
\`\`\`
final_score = (emotional_impact × 0.25) + 
              (thematic_depth × 0.20) + 
              (narrative_structure × 0.15) + 
              (linguistic_technique × 0.15) + 
              (imagery × 0.15) + 
              (originality × 0.10)
\`\`\`

Decimal precision must match \`decimal_precision\` exactly.

---

# LONG-FORM CRITICAL ESSAY (MANDATORY)

After the title section:

You must write **at least three substantial analytical paragraphs** separated by blank lines.

Each paragraph must:
- Contain minimum 5 sentences
- Advance argumentation
- Avoid repetition
- Expand interpretation
- Reflect cynicism_level tonally
- Avoid filler language

Structure:

Paragraph 1 — Interpretative Expansion  
Paragraph 2 — Contextual Positioning  
Paragraph 3 — Cultural / Artistic Longevity

Additional paragraphs allowed.

---

## CONTEXTUAL ANALYSIS SECTION (MANDATORY HEADINGS)

\`\`\`
## Contextual Analysis

### Genre Considerations
### Artistic Intent
### Historical Context
\`\`\`

All headings must appear exactly as written.

**OPTIONAL:** Add \`### Translation Notes\` only if the analysis requires translation context.

---

## COMPARATIVE POSITIONING SECTION

\`\`\`
## Comparative Positioning
\`\`\`

Must include explicit reasoning.  
Must not be empty.

---

# CLASSIFICATION TABLE (STRICT)

Use this table internally but DO NOT include it in your response:

|Score Range|Classification|
|---|---|
|9.5–10.0|Masterpiece|
|9.0–9.4|Landmark|
|8.0–8.9|Excellent|
|7.0–7.9|Very Good|
|6.0–6.9|Good|
|5.0–5.9|Average|
|4.0–4.9|Below Average|
|<4.0|Poor|

Classification must correspond exactly.

**DO NOT OUTPUT THIS TABLE IN YOUR RESPONSE.**

---

# SELF-CHECK PROTOCOL (INTERNAL, DO NOT OUTPUT)

Before finalizing, internally verify:
- YAML validity
- No missing keys
- Math consistency (final_score matches weighted calculation)
- Decimal consistency
- Minimum paragraph count
- No JSON presence
- No external commentary

If any condition fails → internally regenerate.

---

# TERMINATION CONDITION

The response must end immediately after the final Markdown section.  
No trailing explanations.`

interface ReviewInput {
  artist: string
  song: string
  album?: string
  year?: string
  genre?: string
  language: string
  lyrics: string
  cynicism?: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function generateWithGemini(systemPrompt: string, userPrompt: string, dna: string): Promise<GenerationResult> {
  const genAI = new GoogleGenerativeAI(CONFIG.gemini.apiKey)
  const model = genAI.getGenerativeModel({ model: CONFIG.gemini.model })

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: userPrompt }
  ])

  const response = result.response
  
  return {
    content: response.text(),
    modelId: CONFIG.gemini.model,
    dna,
    tokens: response.usageMetadata ? {
      input: response.usageMetadata.promptTokenCount || 0,
      output: response.usageMetadata.candidatesTokenCount || 0,
      total: response.usageMetadata.totalTokenCount || 0
    } : undefined
  }
}

interface GenerationResult {
  content: string
  modelId: string
  dna: string
  tokens?: {
    input: number
    output: number
    total: number
  }
}

async function generateWithOpenAI(systemPrompt: string, userPrompt: string, dna: string): Promise<GenerationResult> {
  const openai = new OpenAI({ apiKey: CONFIG.openai.apiKey })

  const response = await openai.chat.completions.create({
    model: CONFIG.openai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
  })

  return {
    content: response.choices[0]?.message?.content || '',
    modelId: CONFIG.openai.model,
    dna,
    tokens: response.usage ? {
      input: response.usage.prompt_tokens,
      output: response.usage.completion_tokens,
      total: response.usage.total_tokens
    } : undefined
  }
}

async function generateReview(input: ReviewInput, agent?: 'gemini' | 'chat-gpt'): Promise<GenerationResult> {
  const selectedAgent = agent || CONFIG.defaultAgent
  const cynicism = input.cynicism ?? CONFIG.defaultCynicism
  const systemPromptWithCynicism = SYSTEM_PROMPT.replace('{{CYNICISM_LEVEL}}', String(cynicism))
  
  // Generate the DNA and Text for this specific review
  const { text: seedsText, dna } = getRandomSeeds()

  const userPrompt = `
Generate a critical analysis for the following song:

**Artist:** ${input.artist}
**Song:** ${input.song}
${input.album ? `**Album:** ${input.album}` : ''}
${input.year ? `**Year:** ${input.year}` : ''}
${input.genre ? `**Genre:** ${input.genre}` : ''}
**Language:** ${input.language}

**Lyrics:**
\`\`\`
${input.lyrics}
\`\`\`

---

### ⚠️ STYLISTIC INSTRUCTIONS (MUST FOLLOW)

While keeping the **SCORING METHODOLOGY** completely objective and unaffected, adopt the following **WRITING STYLE** for the essay portion of the review. These seeds define your "voice" for this specific text:

${seedsText}

---

Follow the system prompt exactly. Output only the Markdown document.
`

  const agentName = selectedAgent === 'chat-gpt' ? 'ChatGPT' : 'Gemini'
  const modelName = selectedAgent === 'chat-gpt' ? CONFIG.openai.model : CONFIG.gemini.model
  
  log.info(`Generating review for "${input.song}" by ${input.artist}...`)
  log.dim(`Using ${agentName} (${modelName})`)
  log.dim(`Stylistic DNA: [${dna}]`)

  if (selectedAgent === 'chat-gpt') {
    return await generateWithOpenAI(systemPromptWithCynicism, userPrompt, dna)
  } else {
    // Note: ensure generateWithGemini is updated to accept/return DNA too
    return await generateWithGemini(systemPromptWithCynicism, userPrompt, dna)
  }
}

async function saveReview(artistSlug: string, songSlug: string, content: string): Promise<string> {
  const reviewDir = join(CONFIG.outputDir, artistSlug)
  await mkdir(reviewDir, { recursive: true })

  const filepath = join(reviewDir, `${songSlug}.md`)
  await writeFile(filepath, content, 'utf-8')

  log.dim(`Saved to: ${filepath}`)
  return filepath
}

async function processReview(input: ReviewInput): Promise<void> {
  const artistSlug = slugify(input.artist)
  const songSlug = slugify(input.song)

  try {
    const result = await generateReview(input)
    
    // Inject model_used AND stylistic_dna into frontmatter
    const contentWithModel = result.content
      .replace(
        /^(---[\s\S]*?)model_used: ""([\s\S]*?)$/m,
        `$1model_used: "${result.modelId}"$2`
      )
      .replace(
        /^(---[\s\S]*?)(\n---)$/m,
        `$1\nstylistic_dna: "${result.dna}"$2`
      )
    
    const filepath = await saveReview(artistSlug, songSlug, contentWithModel)

    if (result.tokens) {
      log.dim('')
      log.info(`📊 Tokens used:`)
      log.dim(`   Input:  ${result.tokens.input.toLocaleString()} tokens`)
      log.dim(`   Output: ${result.tokens.output.toLocaleString()} tokens`)
      log.dim(`   Total:  ${result.tokens.total.toLocaleString()} tokens`)
      log.dim('')
    }

    log.info('Processing with conversion script...')
    const { execSync } = await import('child_process')
    execSync(`tsx ${CONFIG.processScriptPath} ${filepath}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    })

    log.success(`✅ Successfully created review: ${artistSlug}/${songSlug}`)
  } catch (error) {
    log.error(`Error processing ${input.artist} - ${input.song}: ${error}`)
    throw error
  }
}

async function processBatch(inputs: ReviewInput[], maxConcurrent: number = 3): Promise<void> {
  log.info(`Processing batch of ${inputs.length} reviews (max ${maxConcurrent} concurrent)...\n`)

  const results: Array<{ input: ReviewInput, success: boolean, error?: any }> = []

  for (let i = 0; i < inputs.length; i += maxConcurrent) {
    const chunk = inputs.slice(i, i + maxConcurrent)
    
    const promises = chunk.map(async (input) => {
      try {
        await processReview(input)
        return { input, success: true }
      } catch (error) {
        return { input, success: false, error }
      }
    })

    const chunkResults = await Promise.all(promises)
    results.push(...chunkResults)

    if (i + maxConcurrent < inputs.length) {
      log.warn('Waiting before next batch...\n')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log(`\n${colors.bright}Batch Results:${colors.reset}`)
  log.success(`  Success: ${results.filter(r => r.success).length}`)
  log.error(`  Failed: ${results.filter(r => !r.success).length}`)

  const failed = results.filter(r => !r.success)
  if (failed.length > 0) {
    log.error('\nFailed reviews:')
    failed.forEach(f => {
      log.dim(`  - ${f.input.artist} - ${f.input.song}: ${f.error?.message}`)
    })
  }
}

async function openEditorForLyrics(): Promise<string> {
  const tmpFile = join(tmpdir(), `lyrics-${Date.now()}.txt`)
  const placeholder = `# Paste your lyrics here
# Lines starting with # will be ignored
# Save and close the editor when done

`
  
  await writeFile(tmpFile, placeholder, 'utf-8')
  
  const editor = process.env.EDITOR || process.env.VISUAL || 'nano'
  
  log.info(`Opening ${editor} for lyrics input...`)
  log.dim('Save and close the editor when done\n')
  
  const result = spawnSync(editor, [tmpFile], {
    stdio: 'inherit',
    shell: true
  })
  
  if (result.status !== 0) {
    throw new Error('Editor was closed without saving')
  }
  
  const content = await readFile(tmpFile, 'utf-8')
  await unlink(tmpFile)
  
  const lyrics = content
    .split('\n')
    .filter(line => !line.trim().startsWith('#'))
    .join('\n')
    .trim()
  
  if (!lyrics) {
    throw new Error('No lyrics provided')
  }
  
  return lyrics
}

async function getLyricsFromClipboard(): Promise<string> {
  const { execSync } = await import('child_process')
  
  try {
    const lyrics = execSync('xclip -selection clipboard -o', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim()
    
    if (!lyrics) {
      throw new Error('Clipboard is empty')
    }
    
    return lyrics
  } catch (error: any) {
    if (error.message?.includes('command not found')) {
      log.error('xclip not found. Install it with: sudo apt install xclip')
      log.dim('Alternative: Try xsel with: sudo apt install xsel')
    }
    throw error
  }
}

async function runWizard(): Promise<ReviewInput> {
  log.title('\n♪ Lyrics Review Generator\n')

  const agent = CONFIG.defaultAgent
  const apiKey = agent === 'chat-gpt' ? CONFIG.openai.apiKey : CONFIG.gemini.apiKey
  const agentName = agent === 'chat-gpt' ? 'ChatGPT' : 'Gemini'

  if (!apiKey) {
    log.error(`${agentName} API key not found in environment variables!`)
    log.dim(`Current DEFAULT_AGENT: ${agent}`)
    log.dim(`Add to .env: ${agent === 'chat-gpt' ? 'CHAT_GPT_API_KEY' : 'GEMINI_API_KEY'}=your-key-here\n`)
    process.exit(1)
  }

  log.dim(`Using: ${agentName}\n`)

  const response = await prompts([
    {
      type: 'text',
      name: 'artist',
      message: 'Artist name',
      validate: (value) => value.trim() ? true : 'Artist name is required',
    },
    {
      type: 'text',
      name: 'song',
      message: 'Song title',
      validate: (value) => value.trim() ? true : 'Song title is required',
    },
    {
      type: 'text',
      name: 'album',
      message: 'Album (optional)',
    },
    {
      type: 'select',
      name: 'language',
      message: 'Language',
      choices: [
        { title: 'English', value: 'English' },
        { title: 'Portuguese', value: 'Portuguese' },
        { title: 'Spanish', value: 'Spanish' },
        { title: 'French', value: 'French' },
        { title: 'German', value: 'German' },
        { title: 'Italian', value: 'Italian' },
        { title: 'Japanese', value: 'Japanese' },
        { title: 'Korean', value: 'Korean' },
      ],
      initial: 0,
    },
    {
      type: 'number',
      name: 'cynicism',
      message: 'Cynicism level (0-10)',
      initial: CONFIG.defaultCynicism,
      min: 0,
      max: 10,
      validate: (value) => value >= 0 && value <= 10 ? true : 'Must be between 0 and 10',
    },
  ], {
    onCancel: () => {
      log.warn('\nOperation cancelled')
      process.exit(0)
    }
  })

  const lyrics = await openEditorForLyrics()

  return {
    artist: response.artist,
    song: response.song,
    album: response.album || undefined,
    language: response.language,
    cynicism: response.cynicism,
    lyrics: lyrics,
  }
}

async function runClipboardWizard(): Promise<ReviewInput> {
  log.title('\n♪ Lyrics Review Generator (Clipboard Mode)\n')

  const agent = CONFIG.defaultAgent
  const apiKey = agent === 'chat-gpt' ? CONFIG.openai.apiKey : CONFIG.gemini.apiKey
  const agentName = agent === 'chat-gpt' ? 'ChatGPT' : 'Gemini'

  if (!apiKey) {
    log.error(`${agentName} API key not found in environment variables!`)
    log.dim(`Current DEFAULT_AGENT: ${agent}`)
    log.dim(`Add to .env: ${agent === 'chat-gpt' ? 'CHAT_GPT_API_KEY' : 'GEMINI_API_KEY'}=your-key-here\n`)
    process.exit(1)
  }

  log.dim(`Using: ${agentName}`)
  log.info('Reading lyrics from clipboard...\n')

  const lyrics = await getLyricsFromClipboard()
  
  log.success(`Got ${lyrics.split('\n').length} lines from clipboard\n`)

  const response = await prompts([
    {
      type: 'text',
      name: 'artist',
      message: 'Artist name',
      validate: (value) => value.trim() ? true : 'Artist name is required',
    },
    {
      type: 'text',
      name: 'song',
      message: 'Song title',
      validate: (value) => value.trim() ? true : 'Song title is required',
    },
    {
      type: 'text',
      name: 'album',
      message: 'Album (optional)',
    },
    {
      type: 'select',
      name: 'language',
      message: 'Language',
      choices: [
        { title: 'English', value: 'English' },
        { title: 'Portuguese', value: 'Portuguese' },
        { title: 'Spanish', value: 'Spanish' },
        { title: 'French', value: 'French' },
        { title: 'German', value: 'German' },
        { title: 'Italian', value: 'Italian' },
        { title: 'Japanese', value: 'Japanese' },
        { title: 'Korean', value: 'Korean' },
      ],
      initial: 0,
    },
    {
      type: 'number',
      name: 'cynicism',
      message: 'Cynicism level (0-10)',
      initial: CONFIG.defaultCynicism,
      min: 0,
      max: 10,
      validate: (value) => value >= 0 && value <= 10 ? true : 'Must be between 0 and 10',
    },
  ], {
    onCancel: () => {
      log.warn('\nOperation cancelled')
      process.exit(0)
    }
  })

  return {
    artist: response.artist,
    song: response.song,
    album: response.album || undefined,
    language: response.language,
    cynicism: response.cynicism,
    lyrics: lyrics,
  }
}

export { generateReview, processReview, processBatch, slugify, saveReview, type ReviewInput }

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)

  if (args.includes('--from-clipboard') || args.includes('-c')) {
    const input = await runClipboardWizard()
    await processReview(input)
    process.exit(0)
  }

  if (args.length === 0) {
    const input = await runWizard()
    await processReview(input)
    process.exit(0)
  }

  const mode = args[0]

  if (mode === 'wizard') {
    const input = await runWizard()
    await processReview(input)
  } else if (mode === 'clipboard') {
    const input = await runClipboardWizard()
    await processReview(input)
  } else if (mode === 'batch') {
    const [, inputFile] = args
    const inputs: ReviewInput[] = JSON.parse(await readFile(inputFile, 'utf-8'))
    await processBatch(inputs)
  } else {
    log.error('Unknown mode. Use: pnpm generate [wizard|clipboard|batch <file>]')
    log.dim('\nNo arguments = interactive wizard with editor')
    log.dim('--from-clipboard or -c = read lyrics from clipboard')
    process.exit(1)
  }
}
