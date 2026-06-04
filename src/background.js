// ─── Debugger helpers ───────────────────────────────────────────────────────

function attachDebugger(tabId) {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId }, '1.3', () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

function detachDebugger(tabId) {
  return new Promise((resolve) => {
    chrome.debugger.detach({ tabId }, () => resolve());
  });
}

function debugCommand(tabId, method, params = {}) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

// ─── Core capture function ───────────────────────────────────────────────────

async function captureScreenshot(tabId, options) {
  const { format = 'png', quality = 90, fullPage = true, resolution = 1 } = options;

  // Pixel guardrail for 2× captures
  const MAX_OUTPUT_PIXELS = 50_000_000;

  // Get page dimensions via content script
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (isFullPage, scale) => {
      const body = document.body;
      const docEl = document.documentElement;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
      };

      if (isFullPage) {
        return {
          viewport,
          scrollWidth:  docEl.scrollWidth,
          scrollHeight: docEl.scrollHeight,
          clientWidth:  docEl.clientWidth,
          clientHeight: docEl.clientHeight,
          scale,
        };
      } else {
        return {
          viewport,
          scrollWidth:  viewport.width,
          scrollHeight: viewport.height,
          clientWidth:  viewport.width,
          clientHeight: viewport.height,
          scale,
        };
      }
    },
    args: [fullPage, resolution],
  });

  const dims = injection.result;
  const scale = dims.scale || 1;

  // Estimate output pixels and check guardrail
  const estimatedOutputPixels = dims.scrollWidth * dims.scrollHeight * scale * scale;
  if (estimatedOutputPixels > MAX_OUTPUT_PIXELS) {
    throw new Error('Captura muito grande para 2×. Use 1× ou capture uma área menor.');
  }

  await attachDebugger(tabId);

  try {
    const screenshotFormat = format === 'jpeg' || format === 'webp' ? format : 'png';
    const params = {
      format: screenshotFormat,
      captureBeyondViewport: fullPage,
    };

    if (format === 'jpeg') params.quality = quality;

    if (fullPage) {
      params.clip = {
        x: 0,
        y: 0,
        width:  dims.scrollWidth,
        height: dims.scrollHeight,
        scale: scale,
      };
    } else if (scale > 1) {
      // For visible-only 2×, use explicit viewport clip
      params.clip = {
        x: dims.viewport.x,
        y: dims.viewport.y,
        width:  dims.viewport.width,
        height: dims.viewport.height,
        scale: scale,
      };
    }

    const result = await debugCommand(tabId, 'Page.captureScreenshot', params);

    // Calculate actual output dimensions for preview
    const outputDims = {
      scrollWidth: Math.ceil(dims.scrollWidth * scale),
      scrollHeight: Math.ceil(dims.scrollHeight * scale),
    };

    return { data: result.data, dims: outputDims };

  } finally {
    // Always detach even on error — removes the DevTools yellow bar
    await detachDebugger(tabId);
  }
}

// ─── Message router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'capture') {
    captureScreenshot(message.tabId, message.options)
      .then((result) => sendResponse({ success: true,  ...result }))
      .catch((err)   => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async
  }

  if (message.action === 'download') {
    chrome.downloads.download(
      { url: message.dataUrl, filename: message.filename },
      () => sendResponse({ success: true })
    );
    return true;
  }
});
