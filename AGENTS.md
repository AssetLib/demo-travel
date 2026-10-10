# AGENTS.md

Roam is a small, fictional travel app built with Expo. It is a public, MIT-licensed example of a customer's app using the Assetlib JavaScript SDK (`@assetlib/sdk-core` and `@assetlib/sdk-expo` from [AssetLib/sdk-js](https://github.com/AssetLib/sdk-js)) with three placements and bundled fallbacks. Its default route is Travel; the Tasks route is kept to show one app receiving several placements. The maintainers deploy https://assetlib-travel.vercel.app from this repo's static web export. [AssetLib/demo-todo](https://github.com/AssetLib/demo-todo) ("Daylight") shares this source and differs only in the default variant (`EXPO_PUBLIC_ASSETLIB_DEMO`), app name/slug/scheme, package name and README. Make shared changes in both repos.

## Commands

Use the `package.json` scripts; they are what CI runs, and `lint` is stricter than `npx expo lint`.

```sh
npm ci                  # installs the SDK from the tarballs in vendor/
npm run assets:codegen  # assetlib.catalog.json -> src/assets.generated.ts, offline
npm run typecheck       # tsc --noEmit
npm run lint            # eslint src --max-warnings 0
npm run export:web      # expo export --platform web -> dist/
npm run preview:web     # serve dist/ at http://127.0.0.1:4176 (ASSETLIB_PREVIEW_PORT to change)
npm run verify          # codegen + typecheck + lint + export:web
npm run web -- --localhost --port 8082   # live development
```

CI (`.github/workflows/ci.yml`, Node 24, matching `engines.node` and the Vercel build) runs `npm ci`, `npm run verify`, then `git diff --exit-code -- src/assets.generated.ts`. Work is done when `npm run verify` passes and the generated file has no diff. There is no unit test suite: for connection or image changes, also check the web export by hand (connect, **Check for updates**, reload, **Disconnect this app**).

`EXPO_PUBLIC_*` values (listed in `.env.example`) are compiled into the export; rebuild after changing them. `EXPO_PUBLIC_ASSETLIB_ALLOW_LOOPBACK=true` allows HTTP to a loopback console for local testing only. Never set it for a hosted build.

## Layout

- `assetlib.catalog.json`: the app's placements (`travel.coast`, `travel.ridge`, and `tasks.garden` with states `empty`, `started`, `growing`, `complete`).
- `src/assets.generated.ts`: generated `AppAssets` references. Never edit by hand.
- `src/assetlib/Connection.tsx`: SDK client, public-config parsing and storage, refresh and disconnect, and the `ManagedArtwork` / `ManagedStateArtwork` wrappers that render bundled art when no client exists. `APP_APPEARANCE` requests light artwork because both palettes are light only (the SDK's default follows the system color scheme).
- `src/assetlib/Garden.tsx`, `garden-state.ts`: app-owned task progress picks one of four garden states, each with its own bundled image.
- `src/assetlib/usePublishedAssets.ts`: paged published-asset feed (pages of 12, pinned to the first page's release sequence, aborted on disconnect, refresh and unmount).
- `src/app/`: Expo Router routes `travel`, `tasks`, `connect`; `index.tsx` redirects by variant. There is no tab bar: the non-default screen is reached only by its path, and **Back** on `/connect` returns to `/`. Screen code is in `src/screens/TravelScreen.tsx`; shell, themes and the connection pill are in `src/components/Lab.tsx`.
- `assets/`: bundled fallbacks. `assets/source/*.svg` are the originals; regenerate PNGs with `npm run assets:generate` and `node scripts/generate-progress-assets.mjs`.
- `vendor/`: the `@assetlib/sdk-core` and `@assetlib/sdk-expo` 0.4.0-preview.1 tarballs from the sdk-js `v0.4.0-preview.1` GitHub release, unchanged, and that release's `SHA256SUMS` lines for them (`vendor/README.md` has the update steps).
- `scripts/preview.py`: loopback static server with a hard-coded route list. Add new routes there too.

## Invariants

- **Placements come from the catalog.** Add or change a placement in `assetlib.catalog.json`, run `npm run assets:codegen`, commit both, and use the generated `AppAssets` property. Do not repeat key strings in components, and do not build a flow where placements are typed into the console first. The hosted console's demo workspace seeds these same three placements, so keys and sizes must keep matching (the connection screen lists them in `src/app/connect.tsx`).
- **Bundled fallbacks always render.** Every placement keeps a bundled image: one per state for `tasks.garden`, and `assets/destination-placeholder.png` for the published collection. The app must work before connection, offline, and when delivery, verification or decoding fails. Never remove a `fallback`/`fallbacks` prop or the no-client `BundledImage` path.
- **Public config only.** `readPublicConfig` accepts only the keys in `CONFIG_FIELDS` (the SDK's public config: ids, environment, manifest URL, `pinnedPublicKey`/`keyId` and the `pinnedPublicKeys`/`keyIds` key set the console emits) and rejects anything else; keep it strict, but add a field when the SDK's public config gains one, or pasted configs from the console are rejected. Never add passwords, private signing keys, admin tokens or session cookies to the app, env files or tests. The config is stored in AsyncStorage under `@assetlib/mobile-lab/public-config/v1`; renaming that key drops saved connections. Disconnect removes only the saved config; verified cache and replay protection stay on the device by design.
- **Console host.** Links a person clicks to sign in or use the console go to https://console.assetlib.dev (`CONSOLE_URL` in `src/app/connect.tsx`, `.env.example`, README). The legacy `assetlib-console.vercel.app` host still serves delivery and bearer-token API routes but rejects sign-in, so `safeConsoleUrl` maps it to the canonical console. Saved configs whose manifest URL is on the legacy host must keep working: never reject a delivery host in config parsing.
- **SDK pin.** `@assetlib/sdk-core` and `@assetlib/sdk-expo` move together at one exact version taken from a public sdk-js GitHub release tarball, never a sibling checkout, `npm link`, or a version range. A change touches `package.json`, `package-lock.json`, `vendor/` with `SHA256SUMS` and the `.gitignore` negations (while tarballs are vendored), and the README version text. Rerun codegen afterwards: the `assetlib-codegen` binary ships in sdk-core.
- **The app keeps its own identity.** Roam (`roam` theme) and Daylight (`daylight` theme) use their own palettes, wordmarks, and Fraunces and DM Sans. Assetlib appears only as a quiet label: the app-name suffix, the desktop rail line, the connection pill and the `/connect` screen. Do not add Assetlib logos, colors or marketing copy to app screens.
- **Audit fixtures are intentional.** `assets/coast-hero.png` is 4096 × 3072 on purpose, and `assets/coast-hero-copy.png` is a deliberate unreferenced duplicate. Do not shrink, dedupe or delete them. Keep the 64 × 64 `essential-mark.png` and the app icon bundled.
- **Copy.** In prose and UI text the product is "Assetlib"; `AssetLib` is only the GitHub org in URLs. Keep claims plain and specific: no "instantly", "every screen" or "never release again"; label unbuilt features as planned; no invented customers or metrics. README verification notes carry absolute dates and must stay true.
- **Fix what you find.** Fix a confirmed defect in the same change and record how you verified it. If a fix is unsafe right now, say so in the PR and say when it will be done.

## Release and versioning

There are no tags or GitHub releases; `main` is the source the maintainers deploy. The app version lives in `package.json` (`version`) and `app.json` (`expo.version`). `vercel.json` expects `npm ci`, `npm run export:web` and output in `dist/`, with client-side routes rewritten to `index.html`; keep those working.

## Known gaps (2026-10-09; remove each line once fixed)

- Live publish/refresh/rollback acceptance on SDK 0.4.0-preview.1 passed on 2026-10-09 against the deployed travel demo and the hosted demo workspace: `travel.coast` changed with release 7 and returned with the rollback release 8 (browser check of the web export, not a native or device run).
- Native iOS and Android builds have never been verified.

## Don'ts

- Don't hand-edit `src/assets.generated.ts`, or delete or weaken a fallback path.
- Don't commit `.env*` files other than `.env.example`, or `dist/`, `output/`, `.vercel/`.
- Don't deploy, publish or change hosting settings from an agent session.
- Don't expose the dev server publicly; public previews use the static export.
- Don't run `npm audit fix --force` or move off the Expo SDK 57 matrix to clear advisories; see `DEPENDENCY-REVIEW.md`.

## Expo guidance (from the Expo template)

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

### Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

### Commands

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

### Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

### Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

### Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
