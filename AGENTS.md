This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Project structure

- `src/app/` — Expo Router routes only (`_layout.tsx`, `login.tsx`, `player.tsx`, `(app)/` tabs).
- `src/api/` — `FlowApi` contract + `MockApi`/`HttpApi`, in-memory list cache, simulated uploader.
- `src/components/` — reusable UI (list, item, status views).
- `src/context/` — React context providers (auth/session).
- `src/hooks/` — data hooks.
- `src/lib/` — API clients and helpers (PocketBase, formatting, selectors).
- `src/data/` — fake data in the final API shape (`key`, `name`, `size`, `lastModified`, `url`), used only by `MockApi`.
- `src/constants/` — config flags and the dark theme.
- `src/types/` — shared TypeScript types.

## Environment variables

- `EXPO_PUBLIC_USE_MOCK` — `true` (default) authenticates locally and serves fake data; `false` uses PocketBase `authWithPassword`.
- `EXPO_PUBLIC_POCKETBASE_URL` — PocketBase base URL (default `http://127.0.0.1:8090`).
- `EXPO_PUBLIC_API_URL` — FlowForMe API base URL (defaults to `EXPO_PUBLIC_POCKETBASE_URL`).

## API layer

- The UI only talks to `FlowApi` via `getFlowApi(bucket)` (`src/api/index.ts`); screens never import `src/data`.
- `MockApi` simulates a ~20s Sultano edit after each uploaded original and short-lived presigned URLs (expiry encoded in the `expires` query param).
- `HttpApi` sends the PocketBase Bearer token; a 401 emits an unauthorized event that signs the user out.
- `createCachedFlowApi` keeps the list in memory and refetches when a URL expires or on `invalidate()`.
- Upload keys follow `{username}/{YYYY}-{MM}-{DD}-{uuid}.mp4` via `buildVideoKey(username)`; `uploadVideo({ bucket, username }, file, opts)` builds the key, presigns, uploads and registers it in the mock.

## Domain rules

- Edited files end with `-sultano.mp4` (`EDITED_SUFFIX`). The Originais tab shows originals, the Editados tab shows the suffixed files, and an original gets the "Editado" badge when its edited pair exists.
- A dev-only "Simular gravação" button in the Originais tab (`__DEV__ && USE_MOCK`) exercises the upload flow; remove it in stage 3.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
