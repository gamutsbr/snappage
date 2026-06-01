# CLAUDE.md

Project context for Claude Code and AI coding agents.

---

## Project

**SnapPage** — Chrome/Brave extension for full-page screenshots.
Repo: `github.com/gamutsbr/snappage`
Site: `gamuts.com.br`

---

## Structure

```
src/
├── manifest.json     ← MV3 manifest
├── background.js     ← service worker, Debugger API capture logic
├── popup.html/css/js ← extension popup UI
└── icons/            ← 16/48/128px PNGs
releases/             ← local ZIPs only, gitignored
```

---

## Architecture

Capture flow:

1. Popup → `chrome.runtime.sendMessage({ action: 'capture' })` → background
2. Background injects script to get page dimensions
3. Attaches debugger, calls `Page.captureScreenshot` with `captureBeyondViewport: true`
4. Detaches debugger, returns base64 to popup
5. Popup handles download and/or clipboard

Settings persisted via `chrome.storage.local` with key `snappage_prefs`.

No build step. No dependencies. Pure HTML/CSS/JS served directly by Chrome.

---

## Conventions

- JavaScript, no TypeScript
- 2-space indent, LF line endings
- Comments in English, UI strings in Portuguese (pt-BR)
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`

---

## Versioning

SemVer. On each release:

1. Update `src/manifest.json` → `"version"`
2. Add entry to `CHANGELOG.md`
3. Build package `snappage-vX.X.X.zip` with this structure:

```
snappage-vX.X.X/
├── LEIA-ME.txt
└── src/
	├── manifest.json
	├── background.js
	├── popup.html
	├── popup.css
	├── popup.js
	└── icons/
		├── icon16.png
		├── icon48.png
		└── icon128.png
```

4. Ensure users load the unpacked extension from the `src/` folder
5. Generate the ZIP from the same commit that will receive tag `vX.X.X`
6. `git tag vX.X.X && git push origin vX.X.X`
7. Upload `snappage-vX.X.X.zip` to GitHub Releases

Rules:

- ZIP file must be named `snappage-vX.X.X.zip`
- Do not commit files inside `releases/`

---

## Testing

Load `src/` as unpacked extension in `chrome://extensions`.
No build needed — reload extension after file changes.
