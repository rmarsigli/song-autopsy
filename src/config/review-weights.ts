export const REVIEW_WEIGHTS = {
  emotional_impact: 0.25,
  thematic_depth: 0.20,
  narrative_structure: 0.15,
  linguistic_technique: 0.15,
  imagery: 0.15,
  originality: 0.10,
} as const

export function calculateWeightedScore(scores: {
  emotional_impact: number
  thematic_depth: number
  narrative_structure: number
  linguistic_technique: number
  imagery: number
  originality: number
}): number {
  const weighted = {
    emotional_impact: scores.emotional_impact * REVIEW_WEIGHTS.emotional_impact,
    thematic_depth: scores.thematic_depth * REVIEW_WEIGHTS.thematic_depth,
    narrative_structure: scores.narrative_structure * REVIEW_WEIGHTS.narrative_structure,
    linguistic_technique: scores.linguistic_technique * REVIEW_WEIGHTS.linguistic_technique,
    imagery: scores.imagery * REVIEW_WEIGHTS.imagery,
    originality: scores.originality * REVIEW_WEIGHTS.originality,
  }

  const total = Object.values(weighted).reduce((sum, val) => sum + val, 0)
  return Math.round(total * 10) / 10
}

export function getWeightedScores(scores: {
  emotional_impact: number
  thematic_depth: number
  narrative_structure: number
  linguistic_technique: number
  imagery: number
  originality: number
}) {
  return {
    emotional_impact: Math.round(scores.emotional_impact * REVIEW_WEIGHTS.emotional_impact * 10) / 10,
    thematic_depth: Math.round(scores.thematic_depth * REVIEW_WEIGHTS.thematic_depth * 10) / 10,
    narrative_structure: Math.round(scores.narrative_structure * REVIEW_WEIGHTS.narrative_structure * 10) / 10,
    linguistic_technique: Math.round(scores.linguistic_technique * REVIEW_WEIGHTS.linguistic_technique * 10) / 10,
    imagery: Math.round(scores.imagery * REVIEW_WEIGHTS.imagery * 10) / 10,
    originality: Math.round(scores.originality * REVIEW_WEIGHTS.originality * 10) / 10,
  }
}
