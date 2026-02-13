# Song Autopsy

> "Surgical analysis of song lyrics. Cold. Clinical. Precise."

**Song Autopsy** (formerly Lyrics Sommelier) is an AI-powered platform that performs forensic breakdowns of song lyrics. It treats every song as a specimen, dissecting it across six key dimensions to provide a comprehensive, objective scoring of its artistic merit.

## Core Concept

Unlike traditional music reviews that focus on sound or vibe, Song Autopsy focuses exclusively on the **lyrics**. Using advanced LLMs (Gemini 3 Pro / GPT-5.2), we analyze songs based on:

1.  **Emotional Impact** (25%) - The visceral resonance of the words.
2.  **Thematic Depth** (20%) - Complexity and coherence of the subject matter.
3.  **Narrative Structure** (15%) - How the story or message unfolds.
4.  **Linguistic Technique** (15%) - Use of rhyme, meter, and rhetorical devices.
5.  **Imagery** (15%) - Visual and sensory vividness.
6.  **Originality** (10%) - Uniqueness of voice and perspective.

## Key Features

- **Stylistic Seeds (Style DNA):** To avoid monotonous AI output, the review generator assembles a unique "Style DNA" for every review. It randomly selects options from **10 distinct stylistic dimensions** (such as Sentence Structure, Vocabulary Level, Metaphorical Focus, Narrative Voice, etc.).
    - With 5 options per dimension, this creates **9,765,625 possible style combinations** ($5^{10}$).
    - This ensures that two reviews will almost never "sound" the same, varying widely between Academic, Gonzo, Minimalist, Clinical, or Poetic tones.
- **Dynamic OG Images:** Automatically generates shareable social media cards for every review at build time using `satori`.
    - Visualizes the final score with dynamic color grading (Gold/Green/Blue/Red).
    - Displays "Masterpiece", "Excellent", "Good", or "Trash" classifications.
    - Zero-runtime overhead (generated as static assets).

## Tech Stack

- **Framework:** [Astro 5](https://astro.build) (SSG)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com) & Typography
- **Language:** TypeScript
- **AI Integration:** Google Generative AI (Gemini) & OpenAI API
- **Content:** Markdown & JSON Content Collections
- **Icons:** Unplugin Icons + MDI
- **SEO:** Metadata, Sitemap, Schema.org JSON-LD

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Configure environment variables:
    Copy `.env.example` to `.env` and add your API keys.
    ```env
    gemini_api_key=YOUR_KEY
    gemini_model=gemini-1.5-pro-latest
    # or
    chat_gpt_api_key=YOUR_KEY
    ```

### Development

Start the local development server:

```bash
pnpm dev
```

Visit `http://localhost:4321` to see the site.

## Generating Reviews

The core of this project is the AI review generation pipeline.

### Interactive CLI Generation

To generate a new song review, use the interactive CLI tool. It will prompt you for the song details and use the configured AI agent to write the review.

```bash
pnpm generate
```

### Web UI Generation (Experimental)

For a more visual experience, you can use the localized web interface. This launches a dashboard where you can manage generations, view status, and review outputs in a browser environment.

```bash
pnpm generate:web
```

**Workflow:**
1.  Run `pnpm generate`.
2.  Select AI Model (Gemini or ChatGPT).
3.  Enter Song Name, Artist, and Album.
4.  Optionally paste lyrics directly (or let the AI find them).
5.  Set a "Cynicism Level" (1-10) to adjust the tone of the critique.
6.  The script generates a Markdown artifact.
7.  The system automatically processes this artifact into:
    - A JSON entry in `src/content/artists/`
    - A JSON entry in `src/content/albums/`
    - A Markdown review file in `src/content/reviews/`

### Manual Processing

If you have a raw review markdown file and need to process it manually:

```bash
pnpm process-review path/to/review.md
```

## Project Structure

```
src/
├── components/   # UI Components (ReviewCard, Header, etc.)
├── config/       # Scoring weights and constants
├── content/      # Data collections
│   ├── albums/   # Album metadata (JSON)
│   ├── artists/  # Artist metadata (JSON)
│   └── reviews/  # Generated reviews (Markdown)
├── layouts/      # Astro layouts
├── pages/        # File-based routing
└── utils/        # Shared helper functions
scripts/
├── generate-reviews.ts  # Main AI interaction script
└── process-review.ts    # Logic to organize generated content
```

## Classification System

Scores translate to clinical classifications:

- **9.5+**: Masterpiece
- **9.0 - 9.4**: Exceptional
- **8.0 - 8.9**: Excellent
- **7.0 - 7.9**: Very Good
- **6.0 - 6.9**: Good
- **5.0 - 5.9**: Average
- **4.0 - 4.9**: Below Average
- **3.0 - 3.9**: Poor
- **2.0 - 2.9**: Very Poor
- **< 2.0**: Terrible

## License

MIT.