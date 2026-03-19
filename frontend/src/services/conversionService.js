import { API_BASE_URL, getHeaders } from "./api";

const downloadFile = async (
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
            const errMsg = status.message || status.status || "Unknown error";
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

  // 1. First trigger the conversion/export
  const initialToken = await getToken();
  const triggerRes = await fetch(url, {
    headers: getHeaders(initialToken),
    signal: signal,
  });

  let pollResult = true;
  if (triggerRes.status === 202) {
    if (onProgress) {
      onProgress({
        phase: "processing",
        percent: 5,
        detail: "Starting background processing for large file...",
      });
    }
    pollResult = await pollForDownload();
  } else if (!triggerRes.ok) {
    const errorText = await triggerRes.text();
    let errorMessage = triggerRes.statusText;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) errorMessage = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
      else if (errorJson.detail) errorMessage = errorJson.detail;
      else if (errorJson.title) errorMessage = errorJson.title;
    } catch { 
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  if (signal?.aborted) return null;

  if (Array.isArray(pollResult)) {
    if (onProgress) {
      onProgress({
        phase: "downloading",
        percent: 100,
        detail: "Split files are ready for download.",
      });
    }
    return pollResult;
  }

  // 2. Now handle the actual file transmission
  // We use the browser's native download mechanisms to display progress bars
  // and handle massive files without piping arrays through memory or timing out.
  if (onProgress) {
    onProgress({
      phase: "downloading",
      percent: 100,
      detail: "Starting download in your browser...",
    });
  }

  console.log("[Download] Triggering browser download via <a> tag.");
  const downloadToken = await getToken();
  const fullUrl = url.includes("?")
    ? `${url}&token=${downloadToken}`
    : `${url}?token=${downloadToken}`;

  const a = document.createElement("a");
  a.href = fullUrl;
  a.download = suggestedName;
  a.target = "_blank"; // Open in new tab to help some browsers handle insecure downloads
  document.body.appendChild(a);
  a.click();
  
  if (!isSecure) {
    if (onProgress) {
        onProgress({
            phase: "downloading",
            percent: 100,
            detail: "Download triggered. If nothing happens, look for a 'Keep' or 'Unsafe download' warning in your browser's download manager.",
        });
    }
  }

  setTimeout(() => {
    document.body.removeChild(a);
  }, 5000); // Keep it longer just in case
  return suggestedName;
};

export const conversionService = {
  async convertToPst(
    sessionId,
    getToken,
    excludeEmpty = false,
    onProgress,
    signal,
    email = null,
    splitSizeMb = null,
  ) {
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
  },

  async exportAll(
    sessionId,
    format,
    excludeEmpty,
    getToken,
    onProgress,
    signal,
    options = {},
  ) {
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
  },

  async cancelOperation(sessionId, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/cancel`, {
        method: "POST",
        headers: getHeaders(token),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  },

  async downloadSplitFile(sessionId, fileName, getToken, email = null) {
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
  },
};
