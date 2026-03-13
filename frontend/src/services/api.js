export const API_BASE_URL = "/api"; // Using proxy

export const getHeaders = (token) => {
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const getRecentSessions = async (token) => {
  const res = await fetch(`${API_BASE_URL}/sessions/recent`, {
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const checkDuplicate = async (fingerprint, token) => {
  const res = await fetch(
    `${API_BASE_URL}/sessions/duplicate-check?fingerprint=${encodeURIComponent(fingerprint)}`,
    {
      headers: getHeaders(token),
    },
  );
  return handleResponse(res);
};

export const checkSession = async (sessionId, token) => {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/check`, {
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const deleteSession = async (sessionId, token) => {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (res.status === 204) return;
  return handleResponse(res);
};

export const cancelOperation = async (sessionId, token) => {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/cancel`, {
    method: "POST",
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const getFolderTree = async (sessionId, token, excludeEmpty = true) => {
  const res = await fetch(
    `${API_BASE_URL}/file-details/${sessionId}/folders?excludeEmptyFolders=${excludeEmpty}`,
    { headers: getHeaders(token) },
  );
  return handleResponse(res);
};

// Helper to handle response errors consistently
export const handleResponse = async (res) => {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.error || `Request failed with status ${res.status}`,
    );
  }
  return res.json();
};

export const downloadFile = async (
  url,
  suggestedName,
  token,
  onProgress,
  signal,
) => {
  console.log(
    `[Download] Initiating download for: ${suggestedName} from ${url}`,
  );

  const maxRetries = 300; // 10 minutes max polling
  let retryCount = 0;

  while (retryCount < maxRetries) {
    if (signal?.aborted) throw new Error("AbortError");

    const response = await fetch(url, {
      headers: getHeaders(token),
      signal,
    });

    if (response.status === 202) {
      // Background task still in progress
      onProgress?.({ detail: "Preparing export... please wait" });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      retryCount++;
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) errorMessage = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
        else if (errorJson.detail) errorMessage = errorJson.detail;
        else if (errorJson.title) errorMessage = errorJson.title;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      console.error(`[Download] Fetch failed: ${response.status}`, errorText);
      throw new Error(`Download failed: ${errorMessage}`);
    }

    // Success - 200 OK
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

        const writable = await handle.createWritable();
        await response.body.pipeTo(writable);
        console.log(`[Download] File saved successfully as: ${handle.name}`);
        return handle.name;
      } catch (err) {
        if (err.name === "AbortError") return null;
        console.warn("[Download] File System Access failed, falling back", err);
      }
    }

    // Fallback for browsers without File System Access API
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 100);
    return suggestedName;
  }

  throw new Error("Export timed out. Please try again.");
};
