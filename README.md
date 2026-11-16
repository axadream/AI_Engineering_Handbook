# AI Engineering Handbook

A static handbook generated from a personal AI Engineering Bible.

The source of truth is `source/AI_Engineering_Bible.md`. A build step turns it into a static site in `dist/`, which GitHub Pages publishes.

- Live site: https://alepax.com/AI_Engineering_Handbook/
- Author site: https://alepax.com

## How to publish

1. Edit `source/AI_Engineering_Bible.md`.
2. Build and test locally: `npm run build && npm test` (or run `/publish` in Claude Code).
3. Commit and push to `main`.
4. GitHub Pages deploys automatically through the workflow in `.github/workflows/pages.yml`.

## Requirements

- Node.js 20 or later. The project has no npm dependencies.

## License

The handbook content is licensed under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). See [LICENSE](LICENSE).
