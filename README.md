# Roam — Assetlib travel demo

[Open the hosted travel demo](https://assetlib-travel.vercel.app) · [Create an Assetlib account](https://assetlib-console.vercel.app)

An original Expo app with the real [Assetlib SDK](https://github.com/AssetLib/sdk-js) already connected to three typed image placements. Save fictional travel ideas and open simple itineraries. Bundled artwork keeps the app usable before you connect an account and whenever remote artwork is unavailable.

This is **preview software**. The browser path is the first supported verification target. Native iOS and Android builds have not been verified; neither app-store readiness nor a clean dependency audit is claimed. Read [DEPENDENCY-REVIEW.md](DEPENDENCY-REVIEW.md) before adopting the sample.

## Run

Use Node 22.13 or later, npm, and Python 3 for the optional static preview.

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

Both SDK packages install from exact versioned GitHub release tarballs for **0.2.0-preview.1**. The lockfile records their integrity. No sibling checkout, private registry, or local SDK source is required. `npm run assets:codegen` invokes the installed package's CLI and reads the checked-in catalog offline.

## Connect your account

1. Select **Connect Assetlib** at the bottom of the sample, then open the [Assetlib console](https://assetlib-console.vercel.app).
2. Create an account and a workspace. Its demo app starts with three matching placements and an initial release.
3. Copy the app's **public SDK configuration** from the console. Paste it into the sample and select **Connect and check release**.
4. Open Travel and Tasks. On the connection screen, inspect each image's actual source: **Downloaded**, **Verified cache**, or **Bundled fallback**. Unvisited placements say **Open this screen to load**.
5. In the console, upload different artwork, bind it to a placement, and publish a release.
6. Select **Check for updates** in the running sample, then revisit the relevant screen. Its artwork should change without rebuilding this app. Verify the release number and the actual image separately.

Account credentials stay in the console. The demo accepts only public identifiers, a manifest URL, and a pinned verification key; do not paste passwords, private signing keys, admin tokens, or session cookies.

## Typed placements and local fallbacks

| Generated reference | Placement | Shape | Fallback |
| --- | --- | --- | --- |
| `AppAssets.Travel.coast` | `travel.coast` | 1200 × 900, 4:3 | `assets/coast-hero.png` |
| `AppAssets.Travel.ridge` | `travel.ridge` | 1200 × 900, 4:3 | `assets/ridge-card.png` |
| `AppAssets.Tasks.garden` | `tasks.garden` | 600 × 400, 3:2 | `assets/task-garden.png` |

`assetlib.catalog.json` generates `src/assets.generated.ts`. Components use generated properties rather than repeating placement strings. This preview checks placement identity and shape; it does not claim a separately versioned runtime placement contract.

`src/assetlib/Connection.tsx` creates the real SDK client and renders `AssetlibImage`, using Expo Image for downloaded PNG/WebP support and opting into normalized SVG in the browser. Native uses prepared raster versions. `src/app/connect.tsx` manages setup and refresh. `src/screens/TravelScreen.tsx` and `src/app/tasks.tsx` contain the app screens. Essential navigation and branding remain bundled.

A received manifest is not proof that an image was rendered. Images resolve progressively as their screens need them. Only the configured pinned public key verifies a release; trust the console configuration you paste.

## Storage and disconnect

The public config is remembered in AsyncStorage (browser local storage on web). The SDK separately stores verified manifests and image bytes (IndexedDB on web). Startup restores verified cache and checks the remote manifest.

**Disconnect this app** removes the saved public config and returns to bundled artwork. Verified image cache and replay-protection state remain on the device. Disconnect does not delete an account or fully erase app data. App-owned sample tasks and saved places survive switching screens but reset on page refresh or app restart.

## Original artwork and audit fixtures

The destinations are fictional, and this sample has no booking, synchronized task account, analytics, or billing feature. Original vector sources are in `assets/source/`; regenerate PNGs with `npm run assets:generate`.

`coast-hero.png` is intentionally oversized at 4096 × 3072. `coast-hero-copy.png` is an exact, intentionally unreferenced duplicate. These are synthetic audit fixtures, not customer savings evidence. The unreferenced duplicate is not shipped by Metro, so deleting it is not automatically a bundle-size saving. Keep the 64 × 64 essential mark and app icon bundled.

## Validation and limitations

Verified on 2026-10-07: fresh `npm ci` from the published SDK release artifacts, code generation, typecheck, lint, web export, and Expo dependency compatibility. Across both exported demos, 39 browser checks passed against the real hosted signed release: remote image rendering, correct travel aspect ratios, public-config persistence, verified-cache status after reload, disconnect to bundled images, responsive layouts at 320/390/1440px, and zero page errors. Cache-hit checks are not a network-off test. The included CI repeats the build checks and rejects stale generated references. Native builds remain unverified; native support in the adapter is not a substitute for a device or simulator test.

The hosted travel demo also passed live publish/refresh/rollback acceptance in Chrome. On the same running page, sequence 1 showed the original coast, sequence 2 replaced `travel.coast` with the Alpine weekend artwork, and rollback published sequence 3 and restored the coast. Each change was visibly confirmed after **Check for updates**, without rebuilding the demo. The deployed build uses Node 22. [CI run 37711586159](https://github.com/AssetLib/demo-travel/actions/runs/37711586159) passed for commit `d661ddc927e1395b736b0188a163133e9fe8845e`.

Current compatible Expo dependencies have unresolved advisories, including a router URL-decoding availability concern. No unsupported framework downgrade or speculative major dependency override was applied. See [DEPENDENCY-REVIEW.md](DEPENDENCY-REVIEW.md) for affected chains and primary advisory links. Keep the development server local; use the static export for a public preview.

## License

Original code and illustrations are MIT licensed; see [LICENSE](LICENSE). Upstream template and font notices remain in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), `LICENSE.expo-template`, and `notices/`.

## Component states and a paged collection

The task card selects one of four garden stages from completed / total tasks. Undoing a task or adding a task recomputes the stage. Four original bundled images keep the progression usable before connection and offline; a connected `tasks.garden` state set replaces the complete family from one release. Its catalog declares `empty`, `started`, `growing`, and `complete`. A legacy release without that state set retains the bundled family.

The Travel screen keeps its two sample places, then requests published catalog metadata in pages of 12. `FlatList` mounts a remote image only for a visible collection card, with one shared placeholder and `cachePolicy="memory"`. Pagination pins the first page’s release sequence. Disconnect, refresh, and unmount abort stale page requests. Saving a card saves its identity for this app session; it does not download the collection for offline use. Actual destination names and details belong to the host application; this demo displays published asset names.

Generate the new original SVG/PNG fixtures with `node scripts/generate-progress-assets.mjs`; this leaves the older audit fixtures unchanged.

For a local console at `http://127.0.0.1:3100`, use `EXPO_PUBLIC_ASSETLIB_ALLOW_LOOPBACK=true npm run export:web` and serve that local export. This explicit build flag permits HTTP only on loopback; normal builds keep HTTPS validation. Do not enable it for a hosted release. Paste the local console’s public SDK config through the connection screen.
