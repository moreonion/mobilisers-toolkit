# Mobiliser's Toolkit

A collection of useful tools to make life easier for mobilisers

## Available Tools

- **A/B Testing Calculator** - Statistical analysis with two-proportion and multi-variation testing
- **Clean HTML Tool** - HTML sanitisation and formatting
- **Share Link Generator** - Social media sharing URL builder
- **Prepopulation Link Generator** - Form field pre-filling for email marketing
- **Tracking Link Builder** - UTM parameter management

All commands are run from the root of the project, from a terminal:

| Command              | Action                                       |
| :------------------- | :------------------------------------------- |
| `pnpm install`       | Installs dependencies                        |
| `pnpm run dev`       | Starts local dev server at `localhost:4321`  |
| `pnpm run build`     | Build your production site to `./dist/`      |
| `pnpm run preview`   | Preview your build locally, before deploying |
| `pnpm run typecheck` | Run TypeScript and Svelte checks             |

### Testing Commands

| Command                       | Action                     |
| :---------------------------- | :------------------------- |
| `pnpm run test`               | Run all Playwright tests   |
| `pnpm run test:quick`         | Run quick validation tests |
| `pnpm run test:unit`          | Start Vitest in watch mode |
| `pnpm run test:unit:run`      | Run unit tests once        |
| `pnpm run test:unit:coverage` | Generate coverage report   |

### Tool-Specific Tests

| Command                       | Action                           |
| :---------------------------- | :------------------------------- |
| `pnpm run test:clean-html`    | Test HTML cleaning functionality |
| `pnpm run test:prepopulation` | Test prepopulation link features |
| `pnpm run test:share`         | Test share link generation       |
| `pnpm run test:tracking`      | Test tracking link functionality |

### Astro CLI

| Command                    | Action                                           |
| :------------------------- | :----------------------------------------------- |
| `pnpm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm run astro -- --help` | Get help using the Astro CLI                     |

## Project Structure

```
src/
├── components/     # Reusable Astro and Svelte components
├── data/          # Svelte state stores with persistence
├── functions/     # Business logic organised by feature
├── islands/       # Interactive Svelte components
├── layouts/       # Astro layout templates
└── pages/         # Static pages with .astro files

tests/             # Playwright end-to-end tests
```
