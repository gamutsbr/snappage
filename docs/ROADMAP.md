# SnapPage — Roadmap

SnapPage is a Chrome/Chromium extension focused on full-page screenshot capture, with a long-term path toward richer visual capture, extraction, and documentation workflows.

This roadmap is directional. Items may move between versions as the product matures.

---

## Current stable version

### v1.0.1 — Patch release

Patch focused on release quality, installation clarity, extension icon display, and popup version consistency.

---

## Near-term priorities

Before adding large features, SnapPage should establish a repeatable release and QA process.

Planned work:

- Create an official release checklist.
- Create a local packaging script for `snappage-vX.X.X.zip`.
- Validate package structure before release.
- Validate manifest version, popup version, icons, changelog, and README consistency.
- Keep release assets out of Git.
- Confirm manual install flow in Chrome, Brave, and Edge.

---

## Planned feature roadmap

### v1.1.0 — Quality baseline and release automation

Goal: reduce release mistakes and make every future version easier to ship safely.

Possible scope:

- Release checklist.
- Packaging script.
- Package validation script.
- Basic manual QA checklist.
- Documentation cleanup.

### v1.2.0 — Capture quality improvements

Possible scope:

- Keyboard shortcut.
- WebP format.
- 2× high-resolution capture.

### v1.3.0 — Element capture

Possible scope:

- Hover highlight.
- Click to capture a specific element or block.
- Handle scrollable elements carefully.
- Preserve visual appearance as closely as possible.

### v1.4.0 — Free selection capture

Possible scope:

- Select area manually.
- Adjustable handles.
- Capture selected region.

### v1.5.0 — Post-capture annotations

Possible scope:

- Arrow.
- Rectangle.
- Text.
- Blur/redaction as a possible privacy-focused tool.

### v1.6.0 — Chrome Web Store readiness

Possible scope:

- Privacy policy review.
- Permission review.
- Store listing assets.
- Screenshots.
- Final packaging policy.

---

## Future epic: Video capture with auto-scroll

### Product idea

Allow users to record a video of the current tab or page, optionally with smooth automatic scrolling, to create presentation material for websites, landing pages, portfolios, client previews, documentation, bug reports, and social/video content.

### Possible modes

- Record current tab without auto-scroll.
- Record current tab with vertical auto-scroll.
- Record visible viewport only.
- Future: record selected region.
- Future: record selected element.

### Possible options

- Countdown before recording.
- Scroll speed: slow, medium, fast.
- Stop automatically at page end.
- Manual stop button.
- Preview before download.
- Download video with automatic filename.
- Optional tab audio in a later version.
- Optional cursor visibility in a later version.

### Likely first format

- WebM first.
- MP4 to be researched later.

### Technical concerns

- Lazy-loaded content.
- Infinite scroll pages.
- Sticky headers.
- Scrollable internal containers.
- Heavy animations and FPS drops.
- Recording duration limits.
- Browser permission prompts.
- Tab capture versus display capture implementation choice.

### Privacy principles

- Recording must only start from an explicit user action.
- No background recording.
- Clear recording status in UI.
- Local processing only.
- No upload, analytics, telemetry, or data collection.

### Roadmap placement

This should not enter the immediate v1.1.0 scope. It should be treated as a future epic, likely as an experimental v1.6+ feature or a stable v2.0.0 feature after the screenshot workflow is mature.

---

## Future epic: Element, image, and text extraction

### Product idea

Allow users to inspect a page and choose whether they want to capture a visual block, extract an image source, or copy text from a selected element.

This expands SnapPage from screenshot capture into visual extraction and page documentation.

### Possible modes

- Capture selected block as an image.
- Extract image from selected element.
- Save the best available image source.
- Copy image URL.
- Copy text from selected element.
- Copy cleaned text from selected element.
- Future: copy basic element metadata for documentation/debugging.

### Example user flow

1. User enables an inspection/extraction mode.
2. SnapPage highlights elements under the cursor.
3. User clicks an element.
4. SnapPage offers contextual actions:
   - Capture block as image.
   - Save image.
   - Copy image URL.
   - Copy text.
   - Cancel.

### Image extraction strategy

For normal images, SnapPage should inspect available image data such as:

- Image element `src` attributes.
- Image element `srcset` attributes.
- `picture` and `source` elements.
- The current loaded image source.
- Natural image dimensions.
- Lazy-loading attributes such as `data-src` when useful.
- CSS `background-image` values, if practical.

The goal should be to extract the best available image source, not to promise that the original maximum-resolution asset can always be found.

### Text extraction strategy

For text extraction, SnapPage should focus on real DOM text, not OCR, at least initially.

Possible options:

- Copy exact text.
- Copy cleaned text.
- Preserve line breaks where useful.
- Ignore hidden text where appropriate.

### Technical concerns

- Images loaded through CDNs with size parameters.
- Responsive images where the browser chooses one source.
- CSS background images.
- Lazy-loaded images.
- Cross-origin restrictions.
- Sites that block direct asset access.
- Authenticated/private pages.
- Copyright and usage rights.
- Avoiding behavior that looks like scraping or bypassing protection.

### Privacy and ethics principles

- User-triggered only.
- Local processing where possible.
- No bulk scraping.
- No hidden extraction.
- No analytics or upload.
- Respect that saved assets may have copyright or usage restrictions.

### Relationship with element capture

This epic should build on top of the future element capture workflow, but it should remain a separate product capability.

Element capture answers: "capture what I see."

Image/text extraction answers: "extract the underlying asset or text."

### Roadmap placement

This should be treated as a future epic after the basic screenshot workflow, release process, and element capture are mature.

---

## Parking lot

Ideas that may be evaluated later:

- Blur/redaction tool for sensitive areas.
- Presets for social formats.
- Capture templates for product pages.
- Batch capture of multiple URLs.
- Export naming presets.
- Copy as image and copy as file behavior review.
- Page presentation mode for clean scrolling previews.
