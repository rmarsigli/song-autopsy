---
title: How Score Works
description: Understanding the scoring system behind every review
---

# How Score Works

## Scoring Methodology

Every song review is evaluated across **six core dimensions**, each scored from 0 to 10 with one decimal precision. These scores are then weighted to produce a final score that reflects the overall quality of the lyrics.

### The Six Dimensions

1. **Emotional Impact** (Weight: 25%)
   - The capacity of the lyrics to evoke, sustain, or manipulate emotional responses
   - Measures authenticity, intensity, and resonance with human experience
   - Example: A song that makes you genuinely feel joy, sorrow, or nostalgia

2. **Thematic Depth** (Weight: 20%)
   - The complexity and maturity of ideas explored
   - Goes beyond surface-level topics to explore universal truths or nuanced perspectives
   - Example: A breakup song that explores identity and self-worth beyond just loss

3. **Narrative Structure** (Weight: 15%)
   - How effectively the lyrics tell a story or develop a concept
   - Includes coherence, pacing, and structural integrity
   - Example: Clear progression from problem to resolution, or effective use of verse-chorus dynamics

4. **Linguistic Technique** (Weight: 20%)
   - Mastery of language: wordplay, metaphor, rhythm, rhyme schemes
   - Technical skill in manipulating language for effect
   - Example: Internal rhymes, double meanings, or clever word choices

5. **Imagery** (Weight: 10%)
   - The vividness and originality of visual, sensory, or conceptual images
   - Ability to paint pictures with words
   - Example: "Concrete jungle where dreams are made of" vs. "The city is big"

6. **Originality** (Weight: 10%)
   - Innovation in approach, perspective, or expression
   - Avoidance of clichés and tired tropes
   - Example: Fresh takes on familiar themes or genuinely novel concepts

## Final Score Calculation

The final score is a **weighted average** of all six dimensions:

```
Final Score = (Emotional Impact × 0.25) + (Thematic Depth × 0.20) + 
              (Narrative Structure × 0.15) + (Linguistic Technique × 0.20) + 
              (Imagery × 0.10) + (Originality × 0.10)
```

### Classification System

| Score Range | Classification | Meaning |
|------------|----------------|---------|
| 9.5–10.0 | **Masterpiece** | Near-perfect execution across all dimensions. Timeless quality. |
| 9.0–9.4 | **Landmark** | Exceptional work that sets new standards in its genre. |
| 8.0–8.9 | **Excellent** | Outstanding lyrics with minor imperfections. |
| 7.0–7.9 | **Very Good** | Strong execution with some notable weaknesses. |
| 6.0–6.9 | **Good** | Solid work that achieves its goals but lacks distinction. |
| 5.0–5.9 | **Average** | Competent but unremarkable. Generic execution. |
| 4.0–4.9 | **Below Average** | Significant flaws that undermine the work. |
| < 4.0 | **Poor** | Fundamental failures in multiple dimensions. |

## Cynicism Level

Each review includes a **cynicism level** (0-10) that affects the analytical lens:

- **Low (0-3)**: Generous interpretation, focuses on strengths
- **Medium (4-6)**: Balanced critical approach
- **High (7-10)**: Uncompromising scrutiny, no benefit of the doubt

This doesn't change the scoring criteria, but affects how harshly flaws are judged.

## Consistency & Objectivity

Every examiner (AI model) applies these criteria consistently:
- Same weights and dimensions for all reviews
- No emotional bias or personal taste
- Genre-aware but not genre-favoriting
- Historical context considered but not determinative

The goal is **critical analysis**, not entertainment. We identify what works, what doesn't, and why.
