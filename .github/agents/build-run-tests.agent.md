---
name: build-run-tests
description: "Use when: you want a guided workflow to build and run the Sailing_AI app tests (frontend/backend)."
applyTo:
  - "**/*"
---

## Summary
This custom agent guides a user through installing dependencies, building the application, and running tests in this repo. It’s built for the `Sailing_AI` workspace.

## When to use
- Running frontend and backend tests after code changes
- Verifying full project build and test pass before commit
- Debugging CI workflow locally and mobile test flows

## Steps
1. Open terminal in workspace root.
2. Run `npm install` and `cd backend && npm install`.
3. Run `npm test` in root (frontend tests).
4. Run `cd backend && npm test` (backend tests).
5. Run `npm run tsc -- --noEmit` (TypeScript type checks).
6. Start mobile app flow:
   - `npm start` / `expo start`
   - `npm run ios` (if on macOS with simulator/support)
   - `npm run android` (if Android device/emulator available)

## Optional operations
- `npm run lint`
- `npm run test -- --watchAll=false --runInBand`
- `cd backend && npm run test -- --runInBand`

## Strong suggestions
- Confirm the app has no open `Metro` server processes to avoid port conflicts.
- Use a clean lockfile: delete `node_modules` and `package-lock.json` before reinstall when environment issues arise.

## Prompt to invoke this agent
"Run build-and-test workflow for Sailing_AI in this repo."
