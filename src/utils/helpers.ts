/**
 * Converts text to URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Classification thresholds for review scores
 */
export const SCORE_THRESHOLDS = {
  MASTERPIECE: 9.5,
  EXCEPTIONAL: 9.0,
  EXCELLENT: 8.0,
  VERY_GOOD: 7.0,
  GOOD: 6.0,
  AVERAGE: 5.0,
  BELOW_AVERAGE: 4.0,
  POOR: 3.0,
  VERY_POOR: 2.0,
} as const

/**
 * Get classification label based on score
 */
export function getClassification(score: number): string {
  if (score >= SCORE_THRESHOLDS.MASTERPIECE) return 'Masterpiece'
  if (score >= SCORE_THRESHOLDS.EXCEPTIONAL) return 'Exceptional'
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'Excellent'
  if (score >= SCORE_THRESHOLDS.VERY_GOOD) return 'Very Good'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'Good'
  if (score >= SCORE_THRESHOLDS.AVERAGE) return 'Average'
  if (score >= SCORE_THRESHOLDS.BELOW_AVERAGE) return 'Below Average'
  if (score >= SCORE_THRESHOLDS.POOR) return 'Poor'
  if (score >= SCORE_THRESHOLDS.VERY_POOR) return 'Very Poor'
  return 'Terrible'
}

/**
 * Get color class based on score
 */
export function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'text-green-500'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'text-yellow-500'
  return 'text-red-500'
}

/**
 * Format ISO date string to readable format
 */
export function formatAnalyzedDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Parse genre string or array into array
 */
export function parseGenre(genreString: string | string[]): string[] {
  if (Array.isArray(genreString)) return genreString
  
  return genreString
    .split('/')
    .map(g => g.trim())
    .filter(Boolean)
}
