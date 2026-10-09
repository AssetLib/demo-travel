# Assetlib SDK release tarballs

These are the `@assetlib/sdk-core` and `@assetlib/sdk-expo` **0.4.0-preview.1** tarballs from the [sdk-js v0.4.0-preview.1 GitHub release](https://github.com/AssetLib/sdk-js/releases/tag/v0.4.0-preview.1), copied unchanged. `SHA256SUMS` repeats the release's published hashes for these two files; check them with `shasum -a 256 -c SHA256SUMS` in this directory.

Both dependencies use `file:vendor/...` paths, and `package-lock.json` records each tarball's integrity, so installation needs no sibling SDK checkout or private registry. To move to another release, download both tarballs and `SHA256SUMS` from that release (`gh release download <tag> -R AssetLib/sdk-js -p 'assetlib-sdk-*' -p SHA256SUMS`), verify the hashes, replace these files, and update `package.json`, `package-lock.json`, the `.gitignore` negations and the README version text together.
