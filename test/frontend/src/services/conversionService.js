import { API_BASE_URL, getHeaders } from "./api";

export const conversionService = {
  async convertToPst(sessionId, token, excludeEmpty = false) {
    window.location.href = `${API_BASE_URL}/file-details/${sessionId}/convert-to-pst?excludeEmptyFolders=${excludeEmpty}&token=${token}`;
  },

  async convertToOst(sessionId, token, excludeEmpty = false) {
    window.location.href = `${API_BASE_URL}/file-details/${sessionId}/convert-to-ost?excludeEmptyFolders=${excludeEmpty}&token=${token}`;
  },

  async exportAll(sessionId, format, excludeEmpty, token) {
    window.location.href = `${API_BASE_URL}/file-details/${sessionId}/export?format=${format}&excludeEmptyFolders=${excludeEmpty}&token=${token}`;
  },
};
