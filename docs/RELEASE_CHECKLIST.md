# SnapPage — Release Checklist

This checklist must be completed before publishing any SnapPage release.

The goal is to ensure that the Git tag, GitHub Release, release ZIP, manifest version, documentation, and manual install flow all describe the same version.

---

## 1. Release scope

- [ ] Confirm the release version.
- [ ] Confirm whether this is a patch, minor, or major release.
- [ ] Confirm the release scope is small enough to validate safely.
- [ ] Confirm no unrelated feature work is included.
- [ ] Confirm the release has an entry in `CHANGELOG.md`.

---

## 2. Versioning

- [ ] Update `src/manifest.json`.
- [ ] Confirm `src/manifest.json` has the intended version.
- [ ] Confirm the popup displays the version dynamically from the manifest.
- [ ] Confirm no hardcoded UI version remains in `src/`.

Suggested check:

```bash
grep -RInE "v[0-9]+\.[0-9]+|[0-9]+\.[0-9]+\.[0-9]+" src
```

Expected:

- The manifest version may appear.
- Historical or intentional references must be reviewed.
- The popup must not contain a hardcoded version label.

---

## 3. Documentation

- [ ] Update `CHANGELOG.md`.
- [ ] Update `LEIA-ME.txt` so it mentions the same release version as `src/manifest.json`.
- [ ] Update `README.md` if install instructions, features, compatibility, or roadmap changed.
- [ ] Update `CLAUDE.md` if agent/developer workflow changed.
- [ ] Update docs under `docs/` if release process or roadmap changed.
- [ ] Confirm public documentation does not mention internal/private notes.
- [ ] Confirm `CLAUDE_PRIVATE.md` is not staged.

---

## 4. Manifest validation

- [ ] Confirm `src/manifest.json` is valid JSON.
- [ ] Confirm `manifest_version` is correct.
- [ ] Confirm `name`, `version`, and `description` are present.
- [ ] Confirm top-level `icons` exists.
- [ ] Confirm `action.default_icon` exists.
- [ ] Confirm permissions are still necessary and minimal.
- [ ] Confirm host permissions, if any, are intentional.

Suggested checks:

```
python -m json.tool src/manifest.json > /dev/null
grep -n '"version"' src/manifest.json
grep -n '"icons"' src/manifest.json
grep -n '"default_icon"' src/manifest.json
```

---

## 5. Release package structure

The release ZIP must be named:

```
snappage-vX.X.X.zip
```

The ZIP must contain:

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

The ZIP must not contain:

- [ ] `.git`
- [ ] `.vscode`
- [ ] `releases/`
- [ ] `CLAUDE_PRIVATE.md`
- [ ] unrelated docs
- [ ] temporary files
- [ ] OS metadata files

---

## 6. ZIP validation

- [ ] Recreate the ZIP after the final source changes.
- [ ] Confirm the ZIP exists under `releases/`.
- [ ] Confirm `releases/*.zip` is ignored by Git.

Suggested package command:

Suggested validation command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-release.ps1
```

Before tagging a final release commit, use:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-release.ps1 -RequireCleanGit
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1
```

- [ ] List ZIP contents before publishing.
- [ ] Confirm ZIP contains `LEIA-ME.txt`.
- [ ] Confirm ZIP contains `snappage-vX.X.X/src/manifest.json`.
- [ ] Confirm manifest inside ZIP has the correct version.
- [ ] Confirm manifest inside ZIP has top-level `icons`.
- [ ] Confirm popup files inside ZIP are the updated files.
- [ ] Extract ZIP to a temporary folder outside the repo.
- [ ] Confirm extracted structure is correct.

---

## 7. Manual install QA

Test from the extracted ZIP, not from the working tree.

- [ ] Open `chrome://extensions`.
- [ ] Enable Developer Mode.
- [ ] Click "Load unpacked".
- [ ] Select the extracted `src/` folder.
- [ ] Confirm the extension loads without manifest errors.
- [ ] Confirm the extension card shows the SnapPage icon.
- [ ] Confirm the extension card shows the correct version.
- [ ] Open the popup.
- [ ] Confirm the popup shows the correct version.
- [ ] Run a visible-area capture.
- [ ] Run a full-page capture.
- [ ] Test PNG download.
- [ ] Test JPEG download.
- [ ] Test clipboard copy, if supported by the browser/session.
- [ ] Confirm settings persistence still works.
- [ ] Test at least Chrome and Brave when possible.
- [ ] Test Edge before public store-oriented releases.

---

## 8. Git rules

Before commit:

```
git status -sb
git diff --check
git diff --stat
```

- [ ] Working tree contains only intended changes.
- [ ] `git diff --check` has no whitespace errors.
- [ ] No release ZIP is staged.
- [ ] No private file is staged.
- [ ] Commit message follows Conventional Commits.

Commit example:

```
git add <intended files>
git commit -m "type: message"
```

After commit:

- [ ] Push `main`.
- [ ] Confirm `origin/main` points to the release commit.
- [ ] Create the tag only after the release commit is final.

Tag example:

```
git tag vX.X.X
git push origin vX.X.X
```

---

## 9. GitHub Release publishing

- [ ] Create a GitHub Release from the pushed tag.
- [ ] Use a clear release title.
- [ ] Write manual release notes.
- [ ] Do not rely blindly on generated release notes.
- [ ] Attach the custom release ZIP: `snappage-vX.X.X.zip`.
- [ ] Confirm the custom ZIP appears under Assets.
- [ ] Confirm "Latest" is correct for stable releases.
- [ ] Do not mark stable releases as pre-release.
- [ ] Publish only after the custom ZIP is attached.

Expected assets:

```
snappage-vX.X.X.zip
Source code (zip)
Source code (tar.gz)
```

The installable asset for normal users is `snappage-vX.X.X.zip`.

---

## 10. Post-release verification

After publishing:

```
git status -sb
git log --oneline --decorate -5
git tag --list
git ls-remote --tags origin
git ls-remote --heads origin main
```

Confirm:

- [ ] Working tree is clean.
- [ ] Local `main` is synchronized with `origin/main`.
- [ ] Release tag exists locally.
- [ ] Release tag exists on origin.
- [ ] Tag points to the intended commit.
- [ ] GitHub Release exists.
- [ ] GitHub Release has the custom ZIP asset.
- [ ] Downloaded ZIP from GitHub matches the expected structure.
- [ ] Manual install works from the downloaded GitHub asset.

---

## 11. Things that must never happen again

- [ ] Do not publish a release ZIP without install instructions.
- [ ] Do not publish a release ZIP whose manifest differs from the tagged source.
- [ ] Do not move or rewrite a public release tag casually.
- [ ] Do not commit before reviewing the full diff.
- [ ] Do not tag before recreating and validating the final ZIP.
- [ ] Do not rely on the GitHub auto-generated "Source code" ZIP for normal users.
- [ ] Do not hardcode the visible app version in the popup.
- [ ] Do not add new permissions without documenting why.
- [ ] Do not mix unrelated feature work into a patch release.

---

## Release owner sign-off

Before publishing, confirm:

- [ ] Architect reviewed the diff.
- [ ] Product owner approved the release scope.
- [ ] Manual QA was completed.
- [ ] Release ZIP was validated.
- [ ] GitHub Release text was reviewed.
