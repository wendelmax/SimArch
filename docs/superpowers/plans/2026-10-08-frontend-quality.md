# Frontend Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish a reliable frontend quality baseline with passing lint, unit tests for critical utilities/API behavior, coverage reporting, and mandatory CI checks.

**Architecture:** Keep the existing Vite/React application structure. Add Vitest with a lightweight Node test environment for pure utilities and a fetch mock for the API client. Keep lint fixes limited to correctness and React hook dependency issues already reported by the repository configuration.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library-compatible assertions, ESLint, GitHub Actions.

**Spec:** Approved in conversation: fix frontend lint, add unit tests for critical utilities and API client, add coverage, and make lint/build/tests mandatory in CI. Playwright remains a later phase.

## Global Constraints

- Preserve the current API payload shapes and YAML output format.
- Do not change product behavior unless a test demonstrates an existing defect.
- Keep generated `src/SimArch.Web/wwwroot` artifacts out of the implementation diff.
- CI must run from `src/SimArch.Web/client`.

## Review Focus

- YAML serialization with fallback edges, optional metadata, and escaped strings.
- YAML project metadata parsing for single-cloud and multicloud models.
- API request payloads and default simulation options.
- API error propagation for non-2xx responses.
- Lint fixes must not alter user-visible behavior.

---

### Task 1: Test foundation and utility/API tests

**Files:**
- Modify: `src/SimArch.Web/client/package.json`
- Modify: `src/SimArch.Web/client/package-lock.json`
- Create: `src/SimArch.Web/client/vitest.config.ts`
- Create: `src/SimArch.Web/client/src/test/setup.ts`
- Create: `src/SimArch.Web/client/src/utils/diagramToYaml.test.ts`
- Create: `src/SimArch.Web/client/src/api/client.test.ts`

- [ ] Add Vitest scripts and dev dependencies.
- [ ] Write tests for YAML serialization, escaping, fallback edges, and project metadata parsing.
- [ ] Write tests for API request method, URL, JSON body, and default compare options.
- [ ] Run the focused tests and confirm they execute.
- [ ] Add coverage script with text and lcov reporters.

### Task 2: Correct existing frontend lint failures

**Files:**
- Modify: `src/SimArch.Web/client/src/App.tsx`
- Modify: `src/SimArch.Web/client/src/components/AdrPanel.tsx`
- Modify: `src/SimArch.Web/client/src/components/Canvas.tsx`
- Modify: `src/SimArch.Web/client/src/components/FlowsView.tsx`
- Modify: `src/SimArch.Web/client/src/components/Palette.tsx`
- Modify: `src/SimArch.Web/client/src/components/SimulationLiveView.tsx`
- Modify: `src/SimArch.Web/client/src/data/componentIcons.tsx`

- [ ] Run lint and record the current failures.
- [ ] Fix hook dependencies and unused values without changing behavior.
- [ ] Move or annotate non-component exports required by existing module boundaries.
- [ ] Run lint and TypeScript build.

### Task 3: Enforce frontend quality in CI

**Files:**
- Modify: `.github/workflows/docker-publish.yml`

- [ ] Add a frontend job that runs `npm ci`, `npm run lint`, `npm run test`, `npm run test:coverage`, and `npm run build` from the client directory.
- [ ] Make the Docker build job depend on both backend and frontend quality jobs.
- [ ] Run the same commands locally and inspect the workflow diff.

### Task 4: Final verification

- [ ] Run frontend lint, unit tests, coverage, and build.
- [ ] Run backend build and tests to detect cross-project regressions.
- [ ] Confirm `git status` contains only intended source/config/test/plan changes and no generated `wwwroot` artifacts.
