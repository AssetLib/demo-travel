# Roam — Assetlib travel demo

[Open the hosted travel demo](https://assetlib-travel.vercel.app) · [Create an Assetlib account](https://console.assetlib.dev)

An original Expo app with the real [Assetlib SDK](https://github.com/AssetLib/sdk-js) already connected to three typed image placements. Save fictional travel ideas and open simple itineraries. Bundled artwork keeps the app usable before you connect an account and whenever remote artwork is unavailable.

This is **preview software**. The browser path is the first supported verification target. Native iOS and Android builds have not been verified; neither app-store readiness nor a clean dependency audit is claimed. Read [DEPENDENCY-REVIEW.md](DEPENDENCY-REVIEW.md) before adopting the sample.

## Run

Use Node 24 (`engines` in `package.json`; CI uses the same), npm, and Python 3 for the optional static preview.

```sh
npm ci
npm run assets:codegen
npm run typecheck
npm run lint
npm run export:web
npm run preview:web
```

Open `http://127.0.0.1:4176`. If occupied, use `ASSETLIB_PREVIEW_PORT=4186 npm run preview:web`. For live development, use `npm run web -- --localhost --port 8082`.

The default route is Travel, encoded in source and app configuration, so no environment file is required. Both screens remain available to demonstrate one app receiving different placements. Optional public settings are in `.env.example`; copy it to `.env.local` to override the console URL or default view, then restart Expo or rebuild the export. Never put account credentials or private keys in public environment variables.

Both SDK packages install from the exact **0.4.0-preview.1** tarballs published on the [sdk-js GitHub release](https://github.com/AssetLib/sdk-js/releases/tag/v0.4.0-preview.1). They are copied unchanged into `vendor/`, `vendor/SHA256SUMS` repeats the release's hashes, and the lockfile records their integrity. No sibling checkout, private registry, or local SDK source is required. `npm run assets:codegen` invokes the installed package's CLI and reads the checked-in catalog offline.

## Connect your account

1. Select **Connect** in the app bar at the top of the sample, then select **Open Assetlib console** ([console.assetlib.dev](https://console.assetlib.dev)).
2. Create an account and a workspace. Its demo app starts with three matching placements and an initial release.
3. Copy the app's **public SDK configuration** from the console. Paste it into the sample and select **Connect and check release**.
4. Open Travel and Tasks. Travel is the default screen, and **Back** on the connection screen returns to it; the sample has no tab bar, so open Tasks at `/tasks` (for example https://assetlib-travel.vercel.app/tasks). On the connection screen, inspect each image's actual source: **Downloaded**, **Verified cache**, or **Bundled fallback**. Unvisited placements say **Open this screen to load**.
5. In the console, upload different artwork, bind it to a placement, and publish a release.
6. Select **Check for updates** in the running sample, then revisit the relevant screen. Its artwork should change without rebuilding this app. Verify the release number and the actual image separately.

Account credentials stay in the console. The demo accepts only public identifiers, a manifest URL, and pinned verification keys (a single key or the console's key set); do not paste passwords, private signing keys, admin tokens, or session cookies.

## Typed placements and local fallbacks

| Generated reference | Placement | Shape | Fallback |
| --- | --- | --- | --- |
| `AppAssets.Travel.coast` | `travel.coast` | 1200 × 900, 4:3 | `assets/coast-hero.png` |
| `AppAssets.Travel.ridge` | `travel.ridge` | 1200 × 900, 4:3 | `assets/ridge-card.png` |
| `AppAssets.Tasks.garden` | `tasks.garden` | 600 × 400, 3:2, states `empty`, `started`, `growing`, `complete` | `assets/task-garden-<state>.png`, one per state |

`assetlib.catalog.json` generates `src/assets.generated.ts`. Components use generated properties rather than repeating placement strings. This preview checks placement identity and shape; it does not claim a separately versioned runtime placement contract.

`src/assetlib/Connection.tsx` creates the real SDK client and renders `AssetlibImage` and `AssetlibStateImage`, using Expo Image for downloaded PNG/WebP support and opting into normalized SVG in the browser. Both sample palettes are light only, so the app requests light artwork rather than following the system color scheme. Native uses prepared raster versions. `src/app/connect.tsx` manages setup and refresh. `src/screens/TravelScreen.tsx` and `src/app/tasks.tsx` contain the app screens. Essential navigation and branding remain bundled.

A received manifest is not proof that an image was rendered. Images resolve progressively as their screens need them. Only the configured pinned public keys verify a release; trust the console configuration you paste.

## Storage and disconnect

The public config is remembered in AsyncStorage (browser local storage on web). The SDK separately stores verified manifests and image bytes (IndexedDB on web). Startup restores verified cache and checks the remote manifest.

**Disconnect this app** removes the saved public config and returns to bundled artwork. Verified image cache and replay-protection state remain on the device. Disconnect does not delete an account or fully erase app data. App-owned sample tasks and saved places survive switching screens but reset on page refresh or app restart.

## Original artwork and audit fixtures

The destinations are fictional, and this sample has no booking, synchronized task account, analytics, or billing feature. Original vector sources are in `assets/source/`; regenerate PNGs with `npm run assets:generate`.

`coast-hero.png` is intentionally oversized at 4096 × 3072. `coast-hero-copy.png` is an exact, intentionally unreferenced duplicate. These are synthetic audit fixtures, not customer savings evidence. The unreferenced duplicate is not shipped by Metro, so deleting it is not automatically a bundle-size saving. Keep the 64 × 64 essential mark and app icon bundled.

## Validation and limitations

Verified on 2026-10-07 with the SDK release current at that time: fresh `npm ci` from the published SDK release artifacts, code generation, typecheck, lint, web export, and Expo dependency compatibility. Across both exported demos, 39 browser checks passed against the real hosted signed release: remote image rendering, correct travel aspect ratios, public-config persistence, verified-cache status after reload, disconnect to bundled images, responsive layouts at 320/390/1440px, and zero page errors. Cache-hit checks are not a network-off test. The included CI repeats the build checks and rejects stale generated references. Native builds remain unverified; native support in the adapter is not a substitute for a device or simulator test.

The hosted travel demo also passed live publish/refresh/rollback acceptance in Chrome. On the same running page, sequence 1 showed the original coast, sequence 2 replaced `travel.coast` with the Alpine weekend artwork, and rollback published sequence 3 and restored the coast. Each change was visibly confirmed after **Check for updates**, without rebuilding the demo. That deployment was built with Node 22. [CI run 37711586159](https://github.com/AssetLib/demo-travel/actions/runs/37711586159) passed for commit `d661ddc927e1395b736b0188a163133e9fe8845e`.

Verified on 2026-10-09 after moving to SDK 0.4.0-preview.1: both vendored tarballs matched the release's `SHA256SUMS`, and under Node 24 `npm ci`, `npm run verify` (code generation with no diff, typecheck, lint, web export) and `npx expo-doctor` passed. Against the static export in headless Chromium, Travel and Tasks rendered their bundled artwork with no console errors, **Open Assetlib console** opened console.assetlib.dev, and public configs carrying the console's pinned key set were accepted, saved, restored after reload and disconnected, both with a manifest URL on console.assetlib.dev and with one on the legacy assetlib-console.vercel.app delivery host. Delivery responses were stubbed in that check, so it did not verify a live signed release; the live publish/refresh/rollback acceptance above has not been repeated with this SDK version.

Current compatible Expo dependencies have unresolved advisories, including a router URL-decoding availability concern. No unsupported framework downgrade or speculative major dependency override was applied. See [DEPENDENCY-REVIEW.md](DEPENDENCY-REVIEW.md) for affected chains and primary advisory links. Keep the development server local; use the static export for a public preview.

## License

Original code and illustrations are MIT licensed; see [LICENSE](LICENSE). Upstream template and font notices remain in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), `LICENSE.expo-template`, and `notices/`.

## Component states and a paged collection

The task card selects one of four garden stages from completed / total tasks. Undoing a task or adding a task recomputes the stage. Four original bundled images keep the progression usable before connection and offline; a connected `tasks.garden` state set replaces the complete family from one release. Its catalog declares `empty`, `started`, `growing`, and `complete`. A legacy release without that state set retains the bundled family.

The Travel screen keeps its two sample places, then requests published catalog metadata in pages of 12. `FlatList` mounts a remote image only for a visible collection card, with one shared placeholder and `cachePolicy="memory"`. Pagination pins the first page’s release sequence. Disconnect, refresh, and unmount abort stale page requests. Saving a card saves its identity for this app session; it does not download the collection for offline use. Actual destination names and details belong to the host application; this demo displays published asset names.

Generate the new original SVG/PNG fixtures with `node scripts/generate-progress-assets.mjs`; this leaves the older audit fixtures unchanged.

For a local console at `http://127.0.0.1:3100`, use `EXPO_PUBLIC_ASSETLIB_ALLOW_LOOPBACK=true npm run export:web` and serve that local export. This explicit build flag permits HTTP only on loopback; normal builds keep HTTPS validation. Do not enable it for a hosted release. Paste the local console’s public SDK config through the connection screen.
