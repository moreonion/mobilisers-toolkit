# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mobiliser's Toolkit is an Astro-based static site with Svelte islands for interactivity. It provides a collection of utilities for mobilisers including:

- **A/B Testing Calculator** - Statistical analysis with two-proportion and multi-variation testing
- **Clean HTML Tool** - HTML sanitisation and formatting
- **Share Link Generator** - Social media sharing URL builder
- **Prepopulation Link Generator** - Form field pre-filling for email marketing
- **Tracking Link Builder** - UTM parameter management

## Development Commands

### Essential Commands
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development server at localhost:4321
- `pnpm run build` - Build production site (includes Astro check)
- `pnpm run typecheck` - Run TypeScript and Svelte checks
- `pnpm run preview` - Preview production build locally

### Testing Commands
- `pnpm run test` - Run all Playwright tests
- `pnpm run test:quick` - Run quick validation tests
- `pnpm run test:unit` - Start Vitest in watch mode
- `pnpm run test:unit:run` - Run unit tests once
- `pnpm run test:unit:coverage` - Generate coverage report

### Specific Test Files
- `pnpm run test:clean-html` - Test HTML cleaning functionality
- `pnpm run test:prepopulation` - Test prepopulation link features
- `pnpm run test:share` - Test share link generation
- `pnpm run test:tracking` - Test tracking link functionality

## Architecture Overview

### Core Structure
- **Astro Pages** (`src/pages/`) - Static page generation with `.astro` files
- **Svelte Islands** (`src/islands/`) - Interactive components for client-side functionality
- **Functions** (`src/functions/`) - Business logic organised by feature
- **Data Stores** (`src/data/`) - Svelte state management using `svelte-persisted-store`
- **Components** (`src/components/`) - Reusable Astro and Svelte components

### Key Technical Patterns

#### Island Architecture
Each tool follows the pattern:
1. Astro page in `src/pages/[tool-name].astro` for SSG
2. Svelte island in `src/islands/[tool-name].svelte` for interactivity
3. Persistent state store in `src/data/[tool-name]/store.svelte.ts`
4. Business logic functions in `src/functions/[tool-name]/`

#### A/B Testing Implementation
The A/B testing module demonstrates the most complex architecture:
- **Statistical Analysis** - `src/functions/ab-testing/statistical-tests.ts` handles two-proportion z-tests and chi-square tests
- **Validation Layer** - `src/functions/ab-testing/validation.ts` uses Zod schemas for input sanitisation
- **Bonferroni Correction** - `src/functions/ab-testing/bonferroni.ts` for multiple comparison adjustments
- **Test Presets** - `src/functions/ab-testing/test-presets.ts` provides sample data for development

#### State Management Pattern
Uses `svelte-persisted-store` for client-side persistence:
```typescript
export const toolState = persisted('tool-name-state', initialState);
```

## Testing Strategy

### Unit Testing (Vitest)
- Located alongside source files as `*.test.ts`
- Uses Node environment with globals enabled
- Coverage configured for `src/**/*.{js,ts}` excluding test files
- Path alias `@` points to `/src`

### E2E Testing (Playwright)
- Tests in `./tests/` directory
- Runs against development server (auto-started)
- Desktop Chrome configuration
- 2-minute timeout for server startup

### Test Categories
- **Quick Check** - Basic page loading and functionality
- **Feature-Specific** - Individual tool validation
- **Clean HTML** - Sanitisation and formatting verification
- **Prepopulation** - Form field injection testing
- **Share/Tracking** - URL generation validation

## Dependencies and Tooling

### Core Framework
- **Astro 5.9+** - Static site generation
- **Svelte 5.34+** - Component framework with runes
- **TypeScript 5.5+** - Type safety

### Key Libraries
- **jstat** - Statistical calculations for A/B testing
- **zod 3.22+** - Schema validation and type inference
- **svelte-persisted-store** - Client-side state persistence
- **svelte-unstyled-tags** - Accessible component primitives

### Development Tools
- **js-beautify** - HTML formatting
- **sanitize-html** - XSS protection
- **sharp** - Image optimisation
- **@playwright/test** - E2E testing
- **vitest** - Unit testing

## Development Workflow

### Before Making Changes
1. Run `pnpm run typecheck` to verify current state
2. Check relevant unit tests in `src/functions/[feature]/tests/`
3. Review existing patterns in similar features

### After Making Changes
1. Always run `pnpm run typecheck` before committing
2. Run appropriate test suite for changed functionality
3. Use `pnpm run test:quick` for rapid validation

### Working with A/B Testing
- Extensive test coverage in `src/functions/ab-testing/tests/`
- Statistical functions require careful validation
- Use test presets for development data
- Review `todo.md` for known issues and planned improvements

## URL Parameter Testing

Development URLs for testing tool functionality:
- Prepopulation: `?url=https%3A%2F%2Fact.your-organisation.org%2Fcampaign-name`
- Share Link: `?url=https%3A%2F%2Fact.your-organisation.org%2Fcampaign-name`
- Tracking Link: `?url=https://act.your-organisation.org/campaign-name`

## Known Issues

Refer to `todo.md` for current development priorities, particularly around:
- Multi-variant A/B testing winner display logic
- Mobile interface improvements
- P-value display and user experience enhancements