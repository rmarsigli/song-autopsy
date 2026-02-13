export function getClassification(score: number): string {
  if (score >= 9.5) return 'Masterpiece'
  if (score >= 9.0) return 'Exceptional'
  if (score >= 8.0) return 'Excellent'
  if (score >= 7.0) return 'Very Good'
  if (score >= 6.0) return 'Good'
  if (score >= 5.0) return 'Average'
  if (score >= 4.0) return 'Below Average'
  if (score >= 3.0) return 'Poor'
  if (score >= 2.0) return 'Very Poor'
  return 'Terrible'
}

export function formatAnalyzedDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
