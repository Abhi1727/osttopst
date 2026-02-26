import { API_BASE_URL, getHeaders } from "./api";

const downloadFile = async (url, suggestedName, token, onProgress, signal) => {
  console.log(
    `[Download] Initiating download for: ${suggestedName} from ${url}`,
  );

  const pollForDownload = async () => {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes (5s intervals)
    const sessionId = url.split("/file-details/")[1].split("/")[0];

    while (attempts < maxAttempts) {
      if (signal?.aborted) throw new Error("AbortError");

      const checkRes = await fetch(`${API_BASE_URL}/sessions/${sessionId}/check`, {
        headers: getHeaders(token),
        signal: signal,
      });

      if (checkRes.ok) {
        const status = await checkRes.json();
        const isReady =
          (suggestedName.endsWith(".zip") && status.status === "Uploaded") ||
          (suggestedName.endsWith(".pst") && status.isConverted) ||
          (suggestedName.endsWith(".ost") && status.isConverted);

        if (isReady) {
          console.log(`[Download] File is ready, starting actual download...`);
          return true;
        }

        if (status.status === "ConversionFailed" || status.status === "ExportFailed") {
          throw new Error("Conversion or export failed on the server.");
        }
      }

      attempts++;
      if (onProgress) {
        onProgress({
          phase: "processing",
          percent: Math.min(95, 5 + attempts * 0.5),
          detail: `Processing large file... (Attempt ${attempts})`,
        });
      }
      
      // Wait 5s but check signal
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 5000);
        signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("AbortError"));
        });
      });
    }
    throw new Error("Timed out waiting for file conversion.");
  };

  // 1. First trigger the conversion/export
  const triggerRes = await fetch(url, {
    headers: getHeaders(token),
    signal: signal,
  });

  if (triggerRes.status === 202) {
    if (onProgress) {
      onProgress({
        phase: "processing",
        percent: 5,
        detail: "Starting background processing for large file...",
      });
    }
    await pollForDownload();
  } else if (!triggerRes.ok) {
    const errorText = await triggerRes.text();
    throw new Error(`Request failed: ${triggerRes.statusText}`);
  }

  // 2. Now handle the actual file transmission
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [
          {
            description: "Data Files",
            accept: {
              "application/octet-stream": [
                ".pst",
                ".ost",
                ".zip",
                ".eml",
                ".msg",
                ".html",
                ".mhtml",
              ],
            },
          },
        ],
      });

      const response = await fetch(url, {
        headers: getHeaders(token),
        signal: signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Download] Fetch failed: ${response.status} ${response.statusText}`,
          errorText,
        );
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const writable = await handle.createWritable();
      await response.body.pipeTo(writable);
      console.log(`[Download] File saved successfully as: ${handle.name}`);
      return handle.name;
    } catch (err) {
      if (err.name === "AbortError" || err.message === "AbortError") {
        console.log("[Download] Download/Polling cancelled.");
        return null;
      }
      console.error("[Download] File System Access error:", err);
      // Fall through to fallback
    }
  }

  // Fallback for browsers not supporting File System Access API or if it failed
  if (signal?.aborted) return null;
  
  console.log("[Download] Using fallback <a> tag download method.");
  const fullUrl = url.includes("?")
    ? `${url}&token=${token}`
    : `${url}?token=${token}`;

  const a = document.createElement("a");
  a.href = fullUrl;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 100);
  return suggestedName;
};

export const conversionService = {
  async convertToPst(sessionId, token, excludeEmpty = false, onProgress, signal) {
    const url = `${API_BASE_URL}/file-details/${sessionId}/convert-to-pst?excludeEmptyFolders=${excludeEmpty}`;
    return await downloadFile(url, "converted.pst", token, onProgress, signal);
  },

  async convertToOst(sessionId, token, excludeEmpty = false, onProgress, signal) {
    const url = `${API_BASE_URL}/file-details/${sessionId}/convert-to-ost?excludeEmptyFolders=${excludeEmpty}`;
    return await downloadFile(url, "converted.ost", token, onProgress, signal);
  },

  async exportAll(sessionId, format, excludeEmpty, token, onProgress, signal) {
    const url = `${API_BASE_URL}/file-details/${sessionId}/export?format=${format}&excludeEmptyFolders=${excludeEmpty}`;
    return await downloadFile(url, `export_${format.toLowerCase()}.zip`, token, onProgress, signal);
  },

  async cancelOperation(sessionId, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/cancel`, {
        method: "POST",
        headers: getHeaders(token),
      });
      return res.ok;
    } catch (err) {
      console.warn("[ConversionService] Cancel failed:", err);
      return false;
    }
  },
};
