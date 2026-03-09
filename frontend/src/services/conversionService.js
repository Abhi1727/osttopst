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

  const pollForDownload = async () => {
    let attempts = 0;
    const pollIntervalMs = 3000; // 3s polling for faster responsiveness
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
        const isReady =
          (suggestedName.endsWith(".zip") &&
            (s === "uploaded" || s.startsWith("ready"))) ||
          (suggestedName.endsWith(".pst") &&
            (status.isConverted || s.startsWith("ready"))) ||
          (suggestedName.endsWith(".ost") &&
            (status.isConverted || s.startsWith("ready")));

        if (isReady) {
          console.log(
            `[Download] File is ready (status: ${status.status}), starting actual download...`,
          );
          if (status.splitFiles && status.splitFiles.length > 0) {
            return status.splitFiles;
          }
          return true;
        }

        if (s.includes("failed")) {
          console.error("[Download] Backend reported failure:", status);
          throw new Error(
            `Conversion or export failed on the server: ${status.status}`,
          );
        }
      }

      attempts++;
      if (onProgress) {
        const elapsedSec = Math.round((attempts * pollIntervalMs) / 1000);
        const elapsedStr =
          elapsedSec < 60
            ? `${elapsedSec}s`
            : `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s`;
        onProgress({
          phase: "processing",
          percent: Math.min(99, 5 + (attempts / maxAttempts) * 94),
          detail: `Processing your file... (${elapsedStr} elapsed). Large files may take several minutes.`,
        });
      }

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
    throw new Error(`Request failed: ${triggerRes.statusText}`);
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

  console.log("[Download] Using fallback <a> tag download method.");
  const downloadToken = await getToken();
  const fullUrl = url.includes("?")
    ? `${url}&token=${downloadToken}`
    : `${url}?token=${downloadToken}`;

  const a = document.createElement("a");
  a.href = fullUrl;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 100);
  return suggestedName;
};

export const conversionService = {
  async convertToPst(
    sessionId,
    getToken,
    excludeEmpty = true,
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

  async convertToOst(
    sessionId,
    getToken,
    excludeEmpty = true,
    onProgress,
    signal,
    email = null,
    splitSizeMb = null,
  ) {
    let url = `${API_BASE_URL}/file-details/${sessionId}/convert-to-ost?excludeEmptyFolders=${excludeEmpty}`;
    if (splitSizeMb) url += `&splitSizeMb=${splitSizeMb}`;
    if (email) url += `&email=${encodeURIComponent(email)}`;
    return await downloadFile(
      url,
      "converted.ost",
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

  async downloadSplitFile(sessionId, fileName, getToken) {
    const token = await getToken();
    const url = `${API_BASE_URL}/file-details/${sessionId}/download/${encodeURIComponent(fileName)}?token=${token}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  },
};
