import { defineCollection, z } from 'astro:content'

const artistsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    genre: z.array(z.string()),
    language: z.string(),
    country: z.string().optional(),
    formed: z.string().optional(),
    bio: z.string().optional(),
  }),
})

const albumsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    artist_id: z.string(),
    year: z.string(),
    genre: z.array(z.string()).optional(),
    cover_art: z.string().optional(),
  }),
})

const examinersCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string(),
    style: z.array(z.string()),
    model_id: z.string(), // matches model_used in reviews
  }),
})

const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})

const reviewsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    song: z.string(),
    artist_id: z.string(),
    album_id: z.string(),
    analyzed_at: z.coerce.string(), // ISO datetime format
    cynicism_level: z.number().optional(),
    model_used: z.string().optional(),
    stylistic_dna: z.string().optional(),
    
    final_score: z.number(),
    
    scores: z.object({
      emotional_impact: z.number(),
      thematic_depth: z.number(),
      narrative_structure: z.number(),
      linguistic_technique: z.number(),
      imagery: z.number(),
      originality: z.number(),
    }),
    
    texts: z.object({
      emotional_impact: z.string(),
      thematic_depth: z.string().optional(),
      narrative_structure: z.string().optional(),
      linguistic_technique: z.string().optional(),
      imagery: z.string().optional(),
      originality: z.string().optional(),
    }),
    
    strongest_verse: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    essential_for: z.array(z.string()).optional(),
    similar_to: z.array(z.string()).optional(),
  }),
})

export const collections = {
    artists: artistsCollection,
    albums: albumsCollection,
    reviews: reviewsCollection,
    examiners: examinersCollection,
    pages: pagesCollection,
}