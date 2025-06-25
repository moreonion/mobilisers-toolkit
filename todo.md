# Multi-Variant Testing Interface Todo List

## Critical Issues

### Variant Winner Display

1. **Fix green background highlighting** - Currently shows green on incorrect variant (possibly defaulting to last one or variant C instead of actual winner) - *Behaviour seems inconsistent*
2. **Resolve winner calculation logic** - System calculates correct variant but displays wrong one as winner in some cases
3. **Handle tied conversion rates** - When multiple variants have same performance, provide clear messaging instead of generic "at least one variant performs significantly different"
4. **Fix complex winner scenarios** - System gets confused with multiple high-performing variants (e.g., A: 700/699, B: 900/900, C: 400/200) - *Unclear how system should handle multiple clear winners*

### Mobile Interface

5. **Fix disappearing field labels** - Labels not visible on mobile
6. **Improve text alignment** - Text alignment appears incorrect on mobile
7. **Resize input fields** - Inputs are too wide for mobile screens
8. **General mobile layout review** - Overall mobile experience needs improvement

## User Experience Improvements

### Variant Management

9. **Add variant deletion functionality** - Allow users to delete variants A and B when more variants exist
10. **Standardise result markup** - Make multi-variant winner display consistent with two-variant version (current two-variant version preferred)

### Documentation and Clarity
1.  **Simplify technical language** - Replace jargon with user-friendly explanations for novices

### P-Value Issues
12. Move p-value to the advanced settings section
13. **Fix p-value display logic** - Currently showing confusing values (0 for very insignificant, 0.9 for very insignificant) - *Need to verify if this is actually incorrect behaviour*
14. **Add p-value guidance** - Include explanation like "p-value should be lower than X for significant results"

### Technical Details Cleanup

1.  **Remove unnecessary metrics for two-variant tests** - Remove or explain "test statistic" and "confidence interval" as users don't understand/need them
2.  **Simplify multi-variant technical details** - Remove or explain: chi-square statistic, degrees of freedom, overall p-value, Bonferroni correction

## Data Consistency

18. **Maintain result box consistency** - Ensure result box remains same whether data changes or variants are removed
