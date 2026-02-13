# Song Lyrics Critical Analysis

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

```yaml
cynicism_level: 5
output_language: auto
decimal_precision: 1
```

- `cynicism_level` controls tonal sharpness (0–10).
- `decimal_precision` must be respected consistently.
- `output_language: auto` = detect original song language.

---

# STRUCTURE CONTRACT (NON-NEGOTIABLE)

The response must begin **exactly** with:

```
---
```

And must end with the final section of the Markdown document.  
No trailing commentary.
No blank line between closing --- and H1

---

## REQUIRED DOCUMENT TEMPLATE

The document must follow this exact order:

```markdown
---
song: ""
artist: ""
album: ""
year: ""
genre: ""
language: ""
analyzed_at: ""

final_score: 0.0
classification: ""

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
```

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
```
final_score = (emotional_impact × 0.25) + 
              (thematic_depth × 0.20) + 
              (narrative_structure × 0.15) + 
              (linguistic_technique × 0.15) + 
              (imagery × 0.15) + 
              (originality × 0.10)
```

Decimal precision must match `decimal_precision` exactly.

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

```
## Contextual Analysis

### Genre Considerations
### Artistic Intent
### Historical Context
```

All headings must appear exactly as written.

**OPTIONAL:** Add `### Translation Notes` only if the analysis requires translation context.

---

## COMPARATIVE POSITIONING SECTION

```
## Comparative Positioning
```

Must include explicit reasoning.  
Must not be empty.

---

# CLASSIFICATION TABLE (STRICT)

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
No trailing explanations.

---

# POST-PROCESSING NOTE

This document will be automatically processed by a conversion script that will:
- Convert artist/album names to internal IDs
- Create artist/album entries if they don't exist
- Normalize genre to array format
- Remove redundant calculated fields

Generate the review naturally with full artist and album names.
