import { API_BASE_URL, getHeaders } from "./api";

const downloadFile = async (url, suggestedName, token) => {
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

      if (!response.ok) throw new Error("Download failed");

      const writable = await handle.createWritable();
      await response.body.pipeTo(writable);
      return handle.name;
    } catch (err) {
      if (err.name === "AbortError") return null;
      throw err;
    }
  } else {
    // Fallback for browsers not supporting File System Access API
    const fullUrl = url.includes("?")
      ? `${url}&token=${token}`
      : `${url}?token=${token}`;
    const a = document.createElement("a");
    a.href = fullUrl;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return suggestedName;
  }
};

export const conversionService = {
  async convertToPst(sessionId, token, excludeEmpty = false) {
    const url = `${API_BASE_URL}/file-details/${sessionId}/convert-to-pst?excludeEmptyFolders=${excludeEmpty}`;
    return await downloadFile(url, "converted.pst", token);
  },

  async convertToOst(sessionId, token, excludeEmpty = false) {
    const url = `${API_BASE_URL}/file-details/${sessionId}/convert-to-ost?excludeEmptyFolders=${excludeEmpty}`;
    return await downloadFile(url, "converted.ost", token);
  },

  async exportAll(sessionId, format, excludeEmpty, token) {
    const url = `${API_BASE_URL}/file-details/${sessionId}/export?format=${format}&excludeEmptyFolders=${excludeEmpty}`;
    return await downloadFile(url, `export_${format.toLowerCase()}.zip`, token);
  },
};
