# PRD: A/B Testing Statistical Significance Calculator

## 1. Introduction/Overview

Build a statistical significance calculator that provides clean, advertising-free A/B testing analysis for a broader audience. The tool will support both 2-variation and multi-variation (3+) tests whilst integrating seamlessly into the existing Mobilisers Toolkit project architecture.

**Problem Statement**: No good, simple A/B testing tools exist without advertising bloat and unnecessary complexity. Users need reliable statistical analysis without the distraction of marketing content.

**Goal Statement**: Provide accurate, easy-to-interpret statistical significance testing for 2+ variation A/B tests with proper multiple testing corrections (Bonferroni), delivered through a clean, professional interface that gives simple, clear output similar to reference calculators.

## 2. Goals & Success Metrics

**Primary Objectives:**
- Deliver accurate statistical significance testing that matches reference calculators
- Support both 2-variation tests and multi-variation tests (3+) with proper Bonferroni correction
- Implement proper multiple testing corrections for statistical rigour
- Provide clear, actionable results without statistical jargon

**Success Metrics:**
- Results match reference calculators (since butisitstatisticallysignificant.com is down, use alternative references)
- Proper statistical rigor with Bonferroni correction implementation
- Performance under 100ms for typical A/B test datasets
- Clear pass/fail decision making for users

**Timeline**: 3 development phases as outlined in implementation guide

## 3. User Stories

**Primary User Flow (2 Variations):**
- As an A/B tester, I want to input my control and variation data (visitors, conversions) so that I can determine if my test results are statistically significant
- As a marketer, I want to see clear "significant" or "not significant" results with improvement percentages so that I can make confident decisions
- As a product manager, I want to understand the confidence interval for my improvements so that I can communicate realistic expectations

**Multi-Variation User Flow (3+ Variations):**
- As an experimenter testing multiple variations, I want to input data for all my test groups so that I can identify which variations perform significantly better than control
- As a data analyst, I want proper multiple testing correction (Bonferroni) so that I avoid false positives from testing multiple variations simultaneously

**Edge Case Scenarios:**
- As a user with small sample sizes, I want to understand when my test lacks sufficient power to detect significance
- As someone new to statistics, I want clear error messages when I input invalid data (conversions > visitors, negative numbers)

## 4. Functional Requirements

### Core Statistical Functionality
1. **Two-Variation Testing**: Implement two-proportion z-test (via t-test from simple-statistics)
2. **Multi-Variation Testing**: Chi-square test of independence with pairwise comparisons
3. **Bonferroni Correction**: Automatic application for 3+ variation tests to maintain 5% false positive rate
4. **Confidence Intervals**: Calculate and display improvement percentage ranges
5. **P-Value Calculation**: Display exact p-values alongside significance decisions

### Input Validation
6. **Data Validation**: Ensure visitors > 0, conversions ≥ 0, conversions ≤ visitors
7. **Reasonable Limits**: Handle edge cases like zero conversions gracefully
8. **Input Sanitisation**: Accept only numeric inputs for visitor and conversion counts

### Results Display
9. **Clear Significance Indication**: ✅/❌ visual indicators for statistical significance
10. **Improvement Percentages**: Display relative improvement with confidence intervals
11. **Conversion Rates**: Show conversion rates for all variations
12. **Multiple Testing Messaging**: Clear explanation when Bonferroni correction is applied

### User Interface
13. **Progressive Disclosure**: Show simple input form first, then detailed results
14. **Reset Functionality**: Allow users to start over with new data
15. **Responsive Design**: Work on desktop and mobile devices

## 5. Non-Goals (Out of Scope)

**Statistical Methods Not Included:**
- Power analysis and sample size calculations
- Sequential testing or early stopping rules
- Revenue-based statistical tests
- Non-parametric tests
- Bayesian A/B testing approaches

**User Interface Features Excluded:**
- Charts, graphs, or visualisations
- Data export to PDF/CSV
- User accounts or result saving
- File upload for bulk data entry
- Integration with analytics platforms
- Copy-to-clipboard functionality

**Advanced Features Not Included:**
- A/A testing validation
- Historical test tracking
- Team collaboration features
- API endpoints for programmatic access

## 6. Technical Considerations

### Framework Integration
- **Astro Page Structure**: Follow `/src/pages/ab-testing.astro` pattern similar to `clean-html.astro`
- **Svelte 5 Island**: Create `/src/islands/ab-testing.svelte` using Svelte 5 runes (project already migrated)
- **Reactive State Management**: Use `$state()` for input data and results
- **Derived Calculations**: Use `$derived()` and `$derived.by()` for statistical computations

### Statistical Library
- **simple-statistics**: Primary library for `chiSquaredTest()` and `tTestTwoSample()`
- **Custom Bonferroni**: Implement correction function since not built into simple-statistics (include implementation details from original guide)
- **Data Transformation**: Convert visitor/conversion counts to binary arrays for t-test compatibility

### Performance Considerations
- **Client-Side Computation**: All calculations performed in browser
- **Efficient Re-computation**: Use Svelte's fine-grained reactivity for instant results
- **Memory Management**: Handle large datasets (10k+ visitors) efficiently

## 7. Design Considerations

### UI/UX Requirements
- **Clean, Professional Design**: Match existing Mobilisers Toolkit aesthetic
- **Foundation CSS Integration**: Use existing design system with `.button` classes and Foundation framework
- **Form Layout**: Logical grouping of control vs. variation inputs
- **Results Hierarchy**: Most important information (significance) displayed prominently

### Accessibility Requirements
- **WCAG 2.1 AA Compliance**: Proper heading structure, alt text, keyboard navigation
- **Screen Reader Support**: Meaningful labels and ARIA descriptions
- **Colour Independence**: Significance indicators work without colour alone
- **Focus Management**: Logical tab order through form elements

### Responsive Design Needs
- **Mobile-First Approach**: Forms work on small screens
- **Touch-Friendly Inputs**: Adequate button sizes and spacing
- **Readable Results**: Text remains legible on all screen sizes

## 8. Developer Experience Requirements

### Error Handling Strategy
- **Input Validation Errors**: Clear, specific messages for invalid data
- **Statistical Edge Cases**: Handle scenarios like zero conversions gracefully
- **Calculation Failures**: Fallback messaging if statistical computation fails
- **User-Friendly Language**: Avoid technical statistical terminology in error messages

### Logging Requirements
- **Calculation Debugging**: Log input values and statistical test parameters
- **Error Tracking**: Capture and log any statistical computation failures
- **Performance Monitoring**: Track calculation times for optimization

### Development Tooling Needs
- **TypeScript Integration**: Full type safety for statistical calculations
- **Unit Test Coverage**: Comprehensive testing of statistical functions
- **Reference Validation**: Automated comparison against known correct results

## 9. Dependency Strategy

### Preferred Libraries
- **simple-statistics**: Core statistical functions (chi-square, t-test)
- **Reasoning**: Lightweight, well-documented, battle-tested with 99% test coverage

### Integration Approach
- **PNPM Installation**: Add simple-statistics as project dependency using `pnpm add simple-statistics`
- **Import Strategy**: Import specific functions to minimise bundle size
- **Type Definitions**: Leverage TypeScript definitions for type safety

### Maintenance Considerations
- **Minimal Dependencies**: Avoid statistical libraries with many sub-dependencies
- **Stable API**: simple-statistics has stable, well-documented API
- **Community Support**: Active development and issue resolution

## 10. Validation & Testing Requirements

### Reference Calculator Testing
- **Primary References**: VWO calculator, Evan Miller's calculator, SurveyMonkey calculator (butisitstatisticallysignificant.com is down)
- **Test Cases**: Known statistical examples from textbooks with verifiable links
- **Tolerance**: Results within 0.01% of reference calculators

### Bonferroni Correction Implementation
Include detailed implementation from original guide:
```javascript
function bonferroniCorrection(pValues, alpha = 0.05) {
  const numTests = pValues.length;
  const correctedAlpha = alpha / numTests;
  
  return pValues.map(pValue => ({
    originalPValue: pValue,
    correctedPValue: Math.min(pValue * numTests, 1.0),
    isSignificant: pValue <= correctedAlpha,
    correctedAlpha: correctedAlpha
  }));
}
```

### Unit Testing Approach
```javascript
// Example test cases from implementation guide
const testCases = [
  {
    name: "Basic significant test",
    control: { visitors: 1000, conversions: 50 },
    variation: { visitors: 1000, conversions: 70 },
    expectedSignificant: true
  },
  {
    name: "Non-significant test", 
    control: { visitors: 100, conversions: 5 },
    variation: { visitors: 100, conversions: 6 },
    expectedSignificant: false
  }
];
```

### Verifiable Reference Links
- Include links to reference statistical examples that humans can verify
- Links to textbook examples and known statistical test cases
- Documentation of expected results for validation

## 11. Edge Cases & Error Handling

### Statistical Edge Cases
- **Zero Conversions**: Handle gracefully with appropriate messaging about insufficient data
- **Very Small Sample Sizes**: Warn users when statistical power is insufficient
- **Identical Conversion Rates**: Handle cases where variations perform identically
- **Extreme Conversion Rates**: Handle near 0% or near 100% conversion scenarios

### Input Validation Edge Cases
- **Non-Integer Values**: Accept decimal values but validate reasonableness
- **Large Numbers**: Handle enterprise-scale tests with millions of visitors
- **Copy-Paste Errors**: Robust parsing of number inputs with extra characters

### Error Message Specifications
- **Clear, Actionable Language**: "Conversions cannot exceed visitors" instead of generic error
- **Contextual Help**: Explain why certain inputs are invalid
- **Recovery Suggestions**: Guide users toward valid input ranges

## 12. Acceptance Criteria

### Phase 1: Core 2-Variation Testing
- [ ] Calculates statistical significance for two-variation tests
- [ ] Results match reference calculators within 0.01% tolerance
- [ ] Displays conversion rates, improvement percentages, and p-values
- [ ] Input validation prevents invalid data entry
- [ ] Responsive design works on desktop and mobile

### Phase 2: Multi-Variation Support
- [ ] Supports 3+ variation testing with chi-square overall test
- [ ] Implements correct Bonferroni correction for pairwise comparisons
- [ ] Clearly indicates which variations are significantly different from control
- [ ] Explains multiple testing correction to users

### Phase 3: Polish & Production Ready
- [ ] Confidence intervals calculated and displayed correctly
- [ ] Comprehensive error handling for all edge cases
- [ ] Performance under 100ms for typical datasets
- [ ] Complete unit test coverage with reference validation
- [ ] Documentation for statistical methodology

### Quality Gates
- [ ] TypeScript compilation without errors
- [ ] All unit tests passing
- [ ] Accessibility audit passing (WCAG 2.1 AA)
- [ ] Cross-browser compatibility verified
- [ ] Statistical accuracy validated against multiple reference sources

## 13. Open Questions

### Statistical Methodology
- **Sample Size Warnings**: At what threshold should we warn users about insufficient sample size?
- **Confidence Level Options**: Should we allow users to adjust confidence level from default 95%?
- **Effect Size Reporting**: Should we include Cohen's d or other effect size measures?

### User Experience
- **Results Persistence**: Should results remain visible when users modify inputs?
- **Calculation Timing**: Should we show loading states for calculations?
- **Educational Content**: How much statistical education should we include?

### Technical Implementation
- **Svelte 5 Migration**: Any specific challenges with `$derived.by()` for complex calculations?
- **Bundle Size Impact**: Will simple-statistics significantly increase bundle size?
- **Browser Compatibility**: Any statistical functions that don't work in older browsers?

## 14. Technical Architecture

### File Structure
```
src/
├── pages/
│   └── ab-testing.astro          # Main page following clean-html.astro pattern
├── islands/
│   └── ab-testing.svelte         # Interactive calculator using Svelte 5 runes
├── functions/
│   └── ab-testing/
│       ├── statistical-tests.ts  # Core statistical functions
│       ├── bonferroni.ts         # Multiple testing correction
│       └── validation.ts         # Input validation utilities
└── types/
    └── ab-testing.ts             # TypeScript interfaces
```

### Astro Page Structure
Following the pattern from `clean-html.astro`:
```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import ABTestingIsland from "@/islands/ab-testing.svelte";
import Feedback from "@/components/Feedback.astro";
---

<BaseLayout
	title="A/B Testing Statistical Significance Calculator"
	description="Calculate statistical significance for your A/B tests with proper multiple testing corrections"
	socialImageFilename="ab_testing_social.png"
>
	<div id="toolDescription">
		<p>
			Determine if your A/B test results are statistically significant. 
			Supports both 2-variation tests and multi-variation tests with 
			proper Bonferroni correction for multiple comparisons.
		</p>
	</div>

	<div
		id="islandWrapper"
		class="mt-6"
	>
		<ABTestingIsland client:load />
	</div>
	<Feedback />
</BaseLayout>

<style>
	#toolDescription,
	#islandWrapper {
		max-width: 36rem;
	}

	div p {
		margin-bottom: 0;
	}
</style>
```

### Svelte 5 Implementation Pattern
```javascript
// Key runes usage pattern
let controlData = $state({ visitors: 0, conversions: 0 });
let variationData = $state({ visitors: 0, conversions: 0 });
let results = $derived.by(() => {
  if (controlData.visitors && variationData.visitors) {
    return calculateSignificance(controlData, variationData);
  }
  return null;
});
```

### Styling Integration
- **Foundation CSS**: Use existing `.button` classes and Foundation framework
- **Custom Styles**: Follow pattern in `/src/assets/styles/styles.css`
- **Button Classes**: Use `.button.filled`, `.button.small`, etc. as seen in existing islands
- **Responsive Grid**: Use Foundation's grid system for layout

### Integration Points
- **BaseLayout**: Use existing layout component
- **Feedback Component**: Include feedback collection
- **Styling**: Leverage existing Foundation CSS classes and custom button styles
- **Navigation**: Integrate with site navigation structure

This PRD provides comprehensive guidance for implementing a professional A/B testing calculator that meets user needs whilst maintaining statistical rigor and seamless integration with the existing Mobilisers Toolkit project architecture.