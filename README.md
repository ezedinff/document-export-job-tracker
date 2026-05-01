# Document Export Job Tracker

Small full-stack Node.js + TypeScript project that tracks CSV export jobs and demonstrates lean testing with staged CI delivery.

## Stack

- Node.js + TypeScript
- Express
- SQLite (`better-sqlite3`)
- Jest (unit)
- Supertest + Jest (integration/API)
- Selenium WebDriver (UI smoke)
- GitHub Actions (staged pipeline with fail-fast + path filters)

## Features

- Create export jobs with default `queued` status
- Move jobs through lifecycle:
  - `queued -> processing`
  - `processing -> completed` (generates CSV)
  - `processing -> failed`
- Persist jobs in SQLite
- Download generated CSV from completed job endpoint
- Minimal UI served by Express for manual and smoke test usage

## API Endpoints

- `POST /api/exports` create a job (`name` required)
- `GET /api/exports` list all jobs
- `GET /api/exports/:id` get one job
- `POST /api/exports/:id/start` transition to `processing`
- `POST /api/exports/:id/complete` transition to `completed` and generate CSV
- `POST /api/exports/:id/fail` transition to `failed`
- `GET /api/exports/:id/download` download generated CSV

## Project Structure

```text
document-export-job-tracker/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── db/
│   ├── routes/
│   ├── services/
│   ├── validation/
│   └── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── exports/
├── data/
└── .github/workflows/ci.yml
```

## Local Setup

```bash
npm install
npm run db:init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test Commands

```bash
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e
```

Run all fast local checks:

```bash
npm run lint && npm run test:unit && npm run test:integration
```

## SQLite Databases

- Development DB: `data/app.db` (default)
- Test DB: configured by `DB_PATH` in tests/CI

## Lean Testing Process

- Developers run unit + integration tests locally before pushing.
- GitHub Actions runs on push/pull request and uses staged jobs:
  1. `fast-checks` (lint + unit),
  2. `integration-tests`,
  3. `ui-smoke-tests`.
- This is fail-fast: expensive UI tests run only when cheaper tests pass.
- Path-based triggers skip workflow runs for irrelevant non-code changes.
- UI test artifacts (screenshots/logs) upload on failure for quick diagnosis.

## Continuous Delivery Stage

- The workflow includes a `docker-publish` stage after all CI gates succeed.
- Publishing runs only on `push` to `main` (never on pull requests).
- The stage logs in to Docker Hub using repository secrets:
  - `DOCKERHUB_USERNAME`
  - `DOCKERHUB_TOKEN`
- A Docker image is built from `Dockerfile` and pushed with two tags:
  - `DOCKERHUB_USERNAME/document-export-job-tracker:latest`
  - `DOCKERHUB_USERNAME/document-export-job-tracker:<short-sha>`

This keeps the project continuously tested and continuously deliverable as a deployable Docker artifact.

## Notes for Experience Report

Measurable observations you can collect:

- execution time by stage (fast vs integration vs UI smoke),
- number of failures caught in each stage,
- CI minutes saved by fail-fast/path filtering,
- stability of deterministic CSV file output under automated tests.
