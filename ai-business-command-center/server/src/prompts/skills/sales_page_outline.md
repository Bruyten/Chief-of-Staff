# SKILL: sales_page_outline

## OBJECTIVE
Produce a complete sales page outline.

## CONTEXT
- Product: {{product_name}}
- Description: {{product_description}}
- Audience: {{target_audience}}
- Pain point: {{pain_point}}
- Benefits: {{benefits}}
- Price: {{price}}
- CTA: {{cta}}

## RULES
- Section order: HOOK → PROBLEM → AGITATION → SOLUTION → INTRODUCTION →
  BENEFITS → SOCIAL PROOF SLOT → OFFER → BONUSES → GUARANTEE → CTA → FAQ.
- Each section: HEADLINE (≤ 12 words) + 1-3 sentences.
- Headlines never use brand name.
- OFFER section: outcomes, not deliverables.
- GUARANTEE: concrete (days, terms). If not provided, write reasonable
  default and flag with "// assumption".
- FAQ: exactly 5 questions in buyer's voice.

## OUTPUT FORMAT
## Hook
**<headline>**
<1-3 sentences>

## Problem
**<headline>**
<1-3 sentences>

(continue through all 12 sections)
