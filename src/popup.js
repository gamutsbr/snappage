// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULTS = {
  mode:       'full',
  format:     'png',
  quality:    85,
  delay:      0,
  resolution: '1',
  download:   true,
  clipboard:  false,
};

const state = { ...DEFAULTS, busy: false };

// ─── Elements ────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const statusDot       = $('statusDot');
const captureBtn      = $('captureBtn');
const captureText     = $('captureText');
const qualitySlider   = $('qualitySlider');
const qualityValue    = $('qualityValue');
const qualityBox      = $('qualityContainer');
const resolutionGroup = $('resolutionGroup');
const outputDownload  = $('outputDownload');
const outputClipboard = $('outputClipboard');
const outputNote      = $('outputNote');
const previewArea     = $('previewArea');
const previewImg      = $('previewImg');
const previewMeta     = $('previewMeta');
const toast           = $('toast');

function getFormatMeta(format) {
  if (format === 'jpeg') return { mime: 'image/jpeg', ext: 'jpg' };
  if (format === 'webp') return { mime: 'image/webp', ext: 'webp' };
  return { mime: 'image/png', ext: 'png' };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'snappage_prefs';

async function loadSettings() {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const saved = data[STORAGE_KEY];
    if (saved) Object.assign(state, saved);
  } catch {
    // storage unavailable — use defaults silently
  }
}

function saveSettings() {
  const prefs = {
    mode:       state.mode,
    format:     state.format,
    quality:    state.quality,
    delay:      state.delay,
    resolution: state.resolution,
    download:   state.download,
    clipboard:  state.clipboard,
  };
  chrome.storage.local.set({ [STORAGE_KEY]: prefs }).catch(() => {});
}

// ─── Apply saved state to UI ──────────────────────────────────────────────────

function applyStateToUI() {
  // Mode
  setActiveByValue('modeGroup', '.toggle-btn', state.mode);

  // Format + quality slider
  setActiveByValue('formatGroup', '.pill-btn', state.format);
  qualityBox.style.display = state.format === 'jpeg' ? 'flex' : 'none';
  qualitySlider.value = state.quality;
  qualityValue.textContent = `${state.quality}%`;

  // Resolution
  setActiveByValue('resolutionGroup', '.pill-btn', String(state.resolution || '1'));

  // Delay
  setActiveByValue('delayGroup', '.pill-btn', String(state.delay));

  // Checkboxes
  updateOutputControls();
}

function updateOutputControls() {
  const copySupported = state.format === 'png';
  const clipboardLabel = outputClipboard.closest('.checkbox-label');

  if (!copySupported) {
    state.clipboard = false;
  }

  if (!state.download) {
    state.download = true;
  }

  outputDownload.checked = state.download;
  outputClipboard.checked = copySupported ? state.clipboard : false;
  outputClipboard.disabled = !copySupported;

  if (clipboardLabel) {
    clipboardLabel.hidden = !copySupported;
  }

  if (outputNote) {
    outputNote.hidden = copySupported;
  }
}

function setActiveByValue(parentId, selector, value) {
  const parent = $(parentId);
  parent.querySelectorAll(selector).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === value);
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  setAppVersion();
  setStatus('ready');

  // Load saved preferences before building UI
  await loadSettings();
  applyStateToUI();

  // ── Listeners ──────────────────────────────────────────────────────────────

  // Mode
  delegate('modeGroup', '.toggle-btn', (btn) => {
    activateIn('modeGroup', btn);
    state.mode = btn.dataset.value;
    saveSettings();
  });

  // Format
  delegate('formatGroup', '.pill-btn', (btn) => {
    activateIn('formatGroup', btn);
    state.format = btn.dataset.value;
    qualityBox.style.display = state.format === 'jpeg' ? 'flex' : 'none';
    updateOutputControls();
    saveSettings();
  });

  // Resolution
  delegate('resolutionGroup', '.pill-btn', (btn) => {
    activateIn('resolutionGroup', btn);
    state.resolution = btn.dataset.value;
    saveSettings();
  });

  // Quality slider
  qualitySlider.addEventListener('input', () => {
    state.quality = parseInt(qualitySlider.value, 10);
    qualityValue.textContent = `${state.quality}%`;
    saveSettings();
  });

  // Delay
  delegate('delayGroup', '.pill-btn', (btn) => {
    activateIn('delayGroup', btn);
    state.delay = parseInt(btn.dataset.value, 10);
    saveSettings();
  });

  // Checkboxes — at least one must stay checked
  outputDownload.addEventListener('change', () => {
    state.download = outputDownload.checked;
    if (!state.download && !state.clipboard) {
      outputDownload.checked = true;
      state.download = true;
    }
    saveSettings();
  });

  outputClipboard.addEventListener('change', () => {
    state.clipboard = outputClipboard.checked;
    if (!state.download && !state.clipboard) {
      outputClipboard.checked = true;
      state.clipboard = true;
    }
    saveSettings();
  });

  // Preview close
  $('previewClose').addEventListener('click', () => {
    previewArea.style.display = 'none';
  });

  // Capture button
  captureBtn.addEventListener('click', handleCapture);
});

function setAppVersion() {
  const appVersionEl = document.querySelector('[data-app-version]');
  if (!appVersionEl) return;

  try {
    const manifest = chrome.runtime.getManifest();
    if (manifest?.version) {
      appVersionEl.textContent = `v${manifest.version}`;
      return;
    }
  } catch {
    // keep fallback placeholder if runtime manifest is unavailable
  }

  appVersionEl.textContent = 'v?';
}

// ─── Capture handler ─────────────────────────────────────────────────────────

async function handleCapture() {
  if (state.busy) return;

  state.busy = true;
  captureBtn.disabled = true;

  try {
    // ── Countdown ──────────────────────────────────
    if (state.delay > 0) {
      setStatus('counting');
      for (let i = state.delay; i > 0; i--) {
        captureText.textContent = `AGUARDANDO ${i}s…`;
        await sleep(1000);
      }
    }

    // ── Capture ────────────────────────────────────
    setStatus('working');
    captureText.textContent = 'CAPTURANDO…';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) throw new Error('Nenhuma aba ativa encontrada');

    const blocked = ['chrome://', 'edge://', 'about:', 'chrome-extension://'];
    if (blocked.some(p => tab.url.startsWith(p))) {
      throw new Error('Não é possível capturar páginas do sistema');
    }

    const result = await chrome.runtime.sendMessage({
      action:  'capture',
      tabId:   tab.id,
      options: {
        format:     state.format,
        quality:    state.quality,
        fullPage:   state.mode === 'full',
        resolution: parseInt(state.resolution, 10),
      },
    });

    if (!result?.success) throw new Error(result?.error || 'Falha ao capturar');

    // ── Build data URL ─────────────────────────────
    const { mime, ext } = getFormatMeta(state.format);
    const shouldCopy = state.format === 'png' && state.clipboard;
    const dataUrl  = `data:${mime};base64,${result.data}`;
    const resolution = parseInt(state.resolution, 10);
    const filename = buildFilename(tab.title, ext, resolution);

    // ── Download ───────────────────────────────────
    if (state.download) {
      await chrome.runtime.sendMessage({ action: 'download', dataUrl, filename });
    }

    // ── Clipboard ──────────────────────────────────
    if (shouldCopy) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ [mime]: blob })]);
      } catch {
        showToast('Clipboard indisponível — salvo como download', 'error');
      }
    }

    // ── Preview ────────────────────────────────────
    renderPreview(dataUrl, result.dims, ext.toUpperCase());

    const verbs = [];
    if (state.download)  verbs.push('baixado');
    if (shouldCopy) verbs.push('copiado');
    showToast(`✓ Print ${verbs.join(' e ')}!`, 'success');
    setStatus('ready');

  } catch (err) {
    showToast(err.message || 'Algo deu errado', 'error');
    setStatus('ready');

  } finally {
    state.busy = false;
    captureBtn.disabled = false;
    captureText.textContent = 'CAPTURAR';
  }
}

// ─── Preview ─────────────────────────────────────────────────────────────────

function renderPreview(dataUrl, dims, fmtLabel) {
  previewImg.src = dataUrl;
  previewMeta.textContent = dims
    ? `${dims.scrollWidth} × ${dims.scrollHeight} px  ·  ${fmtLabel}`
    : fmtLabel;
  previewArea.style.display = 'block';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setStatus(s) {
  statusDot.className = `status-dot ${s}`;
}

function delegate(parentId, selector, fn) {
  $(parentId).addEventListener('click', (e) => {
    const el = e.target.closest(selector);
    if (el) fn(el);
  });
}

function activateIn(parentId, activeEl) {
  $(parentId).querySelectorAll('.active').forEach(el => el.classList.remove('active'));
  activeEl.classList.add('active');
}

function buildFilename(title, ext, resolution = 1) {
  const clean = (title || 'pagina')
    .replace(/[<>:"/\\|?*]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60);
  const resolutionSuffix = resolution > 1 ? `@${resolution}x` : '';

  const now  = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');

  return `${clean}_${date}_${time}${resolutionSuffix}.${ext}`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

let toastTimer;
function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className   = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3200);
}
