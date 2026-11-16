# asmui-vault — Project Instructions

Root workspace rules in the parent CLAUDE.md also apply. This file adds project-specific context only.

## Overview
Personal finance web app (package name `aflow`) with calculations, insights, charts, light/dark theme, and multi-language support. Installable as a PWA.

## Stack
React 19, TypeScript ~6.0, Vite 8, React Router 7, vite-plugin-pwa. Linting with oxlint (not ESLint). npm.

## Commands
- `npm run dev`, `npm run build` (`tsc -b` then `vite build`), `npm run lint` (oxlint), `npm run preview`
- `npm run deploy` runs `vercel --prod` and goes straight to production. Never run it without explicit approval.
- No test runner. Verify with build and lint, and say so when reporting.

## Structure
- `src/utils/`: calculations, insights, format, v15, grab
- `src/hooks/`: useFinance, useLanguage, useTheme
- `src/components/`: Layout, charts and cards (PieChart, MiniBars, StatCard, ProgressBar, ...), toggles
- `src/i18n/`, `src/data/`, `src/pages/`, `src/types.ts`, `src/constants.ts`

## Conventions
- Keep money and finance calculations in `src/utils/calculations.ts`, not in components. Treat changes there as high-risk and double-check results.
- User-facing text goes through `src/i18n/`; do not hardcode strings.
- Follow existing patterns; do not add dependencies without approval.

## Deployment
Vercel (`vercel.json`). Production deploys require approval.

## Repository and secrets
Own Git repo, remote `origin` on GitHub. No `.env` files present.
