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
  const { format = 'png', quality = 90, fullPage = true } = options;

  // Get page dimensions via content script
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      scrollWidth:  document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientWidth:  document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
    }),
  });

  const dims = injection.result;

  await attachDebugger(tabId);

  try {
    const params = {
      format: format === 'jpeg' ? 'jpeg' : 'png',
      captureBeyondViewport: fullPage,
    };

    if (format === 'jpeg') params.quality = quality;

    if (fullPage) {
      params.clip = {
        x: 0,
        y: 0,
        width:  dims.scrollWidth,
        height: dims.scrollHeight,
        scale: 1,
      };
    }

    const result = await debugCommand(tabId, 'Page.captureScreenshot', params);
    return { data: result.data, dims };

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
