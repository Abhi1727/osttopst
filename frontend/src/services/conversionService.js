import { API_BASE_URL, getHeaders } from "./api";

export const triggerDirectDownload = async (url, suggestedName, getToken, onProgress) => {
  if (onProgress) {
    onProgress({
      phase: "downloading",
      percent: 100,
      detail: "Starting download in your browser...",
    });
  }

  const downloadToken = await getToken();
  const fullUrl = url.includes("?")
    ? `${url}&token=${downloadToken}`
    : `${url}?token=${downloadToken}`;

  const a = document.createElement("a");
  a.href = fullUrl;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
  }, 5000);
  return suggestedName;
};

export const downloadFile = async (
  url,
  suggestedName,
  getToken,
  onProgress,
  signal,
) => {
  console.log(
    `[Download] Initiating download for: ${suggestedName} from ${url}`,
  );

  const isSecure = window.isSecureContext;
  if (!isSecure && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
    console.warn("[Download] Running in an insecure context. Browser may block the download or Clerks cryptographic functions. Please see implementation plan for solutions (e.g. Chrome Flags or HTTPS).");
  }

  const pollForDownload = async () => {
    let attempts = 0;
    const pollIntervalMs = 5000; // 5s polling to reduce overhead
    const maxAttempts = 3600; // 3 hours (3s intervals)
    const sessionId = url.split("/file-details/")[1].split("/")[0];

    while (attempts < maxAttempts) {
      if (signal?.aborted) throw new Error("AbortError");

      // Refresh token for each poll to avoid expiration during 2-hour window
      const currentToken = await getToken();

      const checkRes = await fetch(
        `${API_BASE_URL}/sessions/${sessionId}/check`,
        {
          headers: getHeaders(currentToken),
          signal: signal,
        },
      );

        if (checkRes.ok) {
          const status = await checkRes.json();
          const s = (status.status || "").toLowerCase();
          const currentBackendStatus = status.status;
          const isReady =
            (suggestedName.endsWith(".zip") &&
              (s === "uploaded" || s.startsWith("ready"))) ||
            (suggestedName.endsWith(".pst") &&
              (status.isConverted || s.startsWith("ready") || s.includes("ready"))) ||
            (suggestedName.endsWith(".ost") &&
              (status.isConverted || s.startsWith("ready") || s.includes("ready")));

          if (isReady) {
            console.log(
              `[Download] File is ready (status: ${status.status}), starting actual download...`,
            );
            if (status.splitFiles && status.splitFiles.length > 0) {
              return status.splitFiles;
            }
            return true;
          }

          if (s === "limitreached") {
            throw new Error("LICENSE_LIMIT_EXCEEDED");
          }

          if (s.includes("failed")) {
            const errMsg = status.errorMessage || status.message || status.status || "Unknown error";
            console.error("[Download] Backend reported failure:", errMsg);
            throw new Error(`Conversion or export failed: ${errMsg}`);
          }

          // Update detail for progress reporting inside the loop
          if (onProgress) {
            const elapsedSec = Math.round((attempts * pollIntervalMs) / 1000);
            const elapsedStr = elapsedSec < 60 ? `${elapsedSec}s` : `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s`;
            let displayDetail = currentBackendStatus || `Processing your file... (${elapsedStr} elapsed)`;
            
            // Dynamic progress: faster at first, then slower as it reaches limits
            const pseudoProgress = 5 + (1 - Math.exp(-attempts / 150)) * 90;
            
            onProgress({
              phase: "processing",
              percent: Math.min(99, pseudoProgress),
              detail: displayDetail,
            });
          }
        } else if (checkRes.status === 404) {
          throw new Error("Session not found or has expired. Please try uploading again.");
        } else {
          console.warn(`[Download] Poll failed with status ${checkRes.status}, retrying...`);
        }

        attempts++;
        // Wait pollIntervalMs but check signal
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, pollIntervalMs);
        signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("AbortError"));
        });
      });
    }
    const totalMin = Math.round((maxAttempts * pollIntervalMs) / 60000);
    throw new Error(
      `Timed out after ${totalMin} minutes waiting for file conversion. Please try again.`,
    );
  };

  // 1. First trigger the conversion/export via a background-safe check
  const sessionIdMatch = url.match(/\/file-details\/([^/?]+)/);
  const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;

  if (onProgress) {
    onProgress({
      phase: "processing",
      percent: 2,
      detail: "Preparing your request...",
    });
  }

  if (sessionId) {
    const initialToken = await getToken();
    try {
      const checkRes = await fetch(`${API_BASE_URL}/sessions/${sessionId}/check`, {
        headers: getHeaders(initialToken),
        signal,
      });
      if (checkRes.ok) {
        const status = await checkRes.json();
        const s = (status.status || "").toLowerCase();
        
        if (s.startsWith("ready") || s.includes("ready") || status.isConverted) {
           console.log("[Download] Session already ready, skipping trigger.");
           if (status.splitFiles && status.splitFiles.length > 0) {
             return status.splitFiles;
           }
           return triggerDirectDownload(url, suggestedName, getToken, onProgress);
        }
      }
    } catch (err) {
      console.warn("[Download] Pre-check failed, proceeding with trigger:", err);
    }
  }

  const initialToken = await getToken();
  const triggerRes = await fetch(url, {
    headers: getHeaders(initialToken),
    signal: signal,
  });

  if (triggerRes.status === 202) {
    if (onProgress) {
      onProgress({
        phase: "processing",
        percent: 5,
        detail: "Processing your file in the background...",
      });
    }
    const pollResult = await pollForDownload();
    if (Array.isArray(pollResult)) return pollResult;
  } else if (!triggerRes.ok) {
    const errorText = await triggerRes.text();
    let errorMessage = triggerRes.statusText;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) errorMessage = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
      else if (errorJson.detail) errorMessage = errorJson.detail;
    } catch { 
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  } else {
    console.log("[Download] Trigger returned 200, starting native download.");
  }

  return triggerDirectDownload(url, suggestedName, getToken, onProgress);
};

/**
 * Starts a background conversion and polls until status is "Ready".
 * Does NOT trigger a file download — use convertToPst for that.
 */
const triggerConversion = async (sessionId, getToken, onProgress, signal, email = null) => {
  let url = `${API_BASE_URL}/file-details/${sessionId}/convert-to-pst?excludeEmptyFolders=false`;
  if (email) url += `&email=${encodeURIComponent(email)}`;

  const initialToken = await getToken();
  const triggerRes = await fetch(url, {
    headers: getHeaders(initialToken),
    signal,
  });

  if (!triggerRes.ok) {
    const errorText = await triggerRes.text();
    let msg = triggerRes.statusText;
    try { const j = JSON.parse(errorText); msg = j.error || j.detail || j.title || msg; } catch { if (errorText) msg = errorText; }
    throw new Error(msg);
  }

  // 200 means file is immediately ready (already converted). No poll needed.
  if (triggerRes.status !== 202) return;

  // 202: poll status until ready
  const pollIntervalMs = 3000;
  const maxAttempts = 3600;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) throw new Error("AbortError");

    // Update progress bar every tick (not just after fetch)
    if (onProgress) {
      const pseudo = 5 + (1 - Math.exp(-attempt / 120)) * 90;
      onProgress({ phase: "processing", percent: Math.min(99, pseudo) });
    }

    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, pollIntervalMs);
      signal?.addEventListener("abort", () => { clearTimeout(t); reject(new Error("AbortError")); });
    });

    if (signal?.aborted) throw new Error("AbortError");

    const token = await getToken();
    const checkRes = await fetch(`${API_BASE_URL}/sessions/${sessionId}/check`, {
      headers: getHeaders(token),
      signal,
    });

    if (!checkRes.ok) {
      if (checkRes.status === 404) {
        throw new Error("Session not found or has expired. Please try again.");
      }
      continue;
    }

    const status = await checkRes.json();
    const s = (status.status || "").toLowerCase();

    if (s.startsWith("ready") || s.includes("ready")) return;
    if (s === "limitreached") throw new Error("LICENSE_LIMIT_EXCEEDED");
    if (s.includes("failed")) {
      const errMsg = status.errorMessage || status.status || "Conversion failed";
      throw new Error(errMsg);
    }
  }

  throw new Error("Timed out waiting for conversion. Please try again.");
};

export const convertToPst = async (
  sessionId,
  getToken,
  excludeEmpty = false,
  onProgress,
  signal,
  email = null,
  splitSizeMb = null,
) => {
  let url = `${API_BASE_URL}/file-details/${sessionId}/convert-to-pst?excludeEmptyFolders=${excludeEmpty}`;
  if (splitSizeMb) url += `&splitSizeMb=${splitSizeMb}`;
  if (email) url += `&email=${encodeURIComponent(email)}`;
  return await downloadFile(
    url,
    "converted.pst",
    getToken,
    onProgress,
    signal,
  );
};

export const exportAll = async (
  sessionId,
  format,
  excludeEmpty,
  getToken,
  onProgress,
  signal,
  options = {},
) => {
  const params = new URLSearchParams({
    format,
    excludeEmptyFolders: excludeEmpty,
  });
  if (options.folderId) params.append("folderId", options.folderId);
  if (options.entryIds && options.entryIds.length > 0)
    params.append("entryIds", options.entryIds.join(","));
  if (options.year) params.append("year", options.year);
  if (options.month) params.append("month", options.month);
  if (options.startDate) params.append("startDate", options.startDate);
  if (options.endDate) params.append("endDate", options.endDate);
  if (options.email) params.append("email", options.email);

  const url = `${API_BASE_URL}/file-details/${sessionId}/export?${params.toString()}`;
  return await downloadFile(
    url,
    `export_${format.toLowerCase()}.zip`,
    getToken,
    onProgress,
    signal,
  );
};

export const cancelOperation = async (sessionId, token) => {
  try {
    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/cancel`, {
      method: "POST",
      headers: getHeaders(token),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

export const downloadSplitFile = async (sessionId, fileName, getToken, email = null) => {
  const token = await getToken();
  let url = `${API_BASE_URL}/file-details/${sessionId}/download/${encodeURIComponent(fileName)}?token=${token}`;
  if (email) url += `&email=${encodeURIComponent(email)}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
      document.body.removeChild(a);
  }, 1000);
};

// Legacy compatibility object export (for existing code)
export const conversionService = {
  triggerConversion,
  convertToPst,
  exportAll,
  cancelOperation,
  downloadSplitFile,
};
