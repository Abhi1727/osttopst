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

export const downloadFile = async (url, suggestedName, token) => {
  console.log(
    `[Download] Initiating download for: ${suggestedName} from ${url}`,
  );

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
      if (err.name === "AbortError") {
        console.log("[Download] User cancelled the save dialog.");
        return null;
      }
      console.error("[Download] File System Access error:", err);
      // Fall through to fallback
    }
  }

  // Fallback for browsers not supporting File System Access API or if it failed
  console.log("[Download] Using fallback <a> tag download method.");
  const fullUrl = url.includes("?")
    ? `${url}&token=${token}`
    : `${url}?token=${token}`;

  const a = document.createElement("a");
  a.href = fullUrl;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a);
  }, 100);
  return suggestedName;
};
