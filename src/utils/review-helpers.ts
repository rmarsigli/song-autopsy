import type { CollectionEntry } from 'astro:content'

/**
 * Calculate average score from reviews
 */
export function calculateAverageScore(reviews: CollectionEntry<'reviews'>[]): string {
  if (reviews.length === 0) return '0.0'
  const total = reviews.reduce((sum, r) => sum + r.data.final_score, 0)
  return (total / reviews.length).toFixed(1)
}

/**
 * Sort reviews by score (descending)
 */
export function sortByScore(reviews: CollectionEntry<'reviews'>[]): CollectionEntry<'reviews'>[] {
  return [...reviews].sort((a, b) => b.data.final_score - a.data.final_score)
}

/**
 * Sort reviews by date (newest first)
 */
export function sortByDate(reviews: CollectionEntry<'reviews'>[]): CollectionEntry<'reviews'>[] {
  return [...reviews].sort((a, b) => 
    new Date(b.data.analyzed_at).getTime() - new Date(a.data.analyzed_at).getTime()
  )
}

/**
 * Get site URL from environment or fallback
 */
export function getSiteUrl(): string {
  return import.meta.env.PUBLIC_SITE_URL || 'https://songautopsy.online'
}
