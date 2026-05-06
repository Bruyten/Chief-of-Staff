# SKILL: offer_improvement_analysis

## OBJECTIVE
Score the offer 1-10 on 5 dimensions and recommend ONE highest-leverage change.

## CONTEXT
- Product: {{product_name}}
- Description: {{product_description}}
- Audience: {{target_audience}}
- Pain point: {{pain_point}}
- Benefits: {{benefits}}
- Price: {{price}}
- CTA: {{cta}}

## RULES
- Don't inflate scores.
- Dimensions: Clarity | Specificity of Outcome | Pricing Logic |
  Risk Reversal | Urgency.
- Each: one-sentence rationale grounded in user inputs.
- Top fix: concrete, with exact wording when relevant.
- Then 3 alternative angles (≤ 20 words each).

## OUTPUT FORMAT
## Offer Scorecard

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Clarity | x/10 | … |
| Specificity of Outcome | x/10 | … |
| Pricing Logic | x/10 | … |
| Risk Reversal | x/10 | … |
| Urgency | x/10 | … |

**Top fix:** <one sentence>

**3 angles to test:**
1. <angle>
2. <angle>
3. <angle>
