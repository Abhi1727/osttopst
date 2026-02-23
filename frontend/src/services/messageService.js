import { API_BASE_URL, getHeaders, handleResponse } from "./api";

/**
 * Helper to download a file via fetch + blob.
 * This avoids the `window.location.href` approach which breaks with token auth.
 */
async function downloadFile(url, token, defaultFileName = "download") {
  const res = await fetch(url, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.error ||
        errorBody.detail ||
        `Export failed with status ${res.status}`,
    );
  }

  const blob = await res.blob();

  // Extract filename from Content-Disposition header if available
  const disposition = res.headers.get("Content-Disposition");
  let fileName = defaultFileName;
  if (disposition) {
    const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]*)\1/);
    if (match && match[2]) {
      fileName = match[2];
    }
  }

  // Create a temporary link and trigger download
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

function buildFilterParams(filter) {
  const params = new URLSearchParams();
  if (filter) {
    if (filter.year) params.append("year", filter.year);
    if (filter.month) params.append("month", filter.month);
    if (filter.startDate) params.append("startDate", filter.startDate);
    if (filter.endDate) params.append("endDate", filter.endDate);
  }
  return params;
}

export const messageService = {
  async exportAll(sessionId, format, token, filter = null) {
    let url = `${API_BASE_URL}/file-details/${sessionId}/export?format=${format}`;
    const params = buildFilterParams(filter);
    const filterString = params.toString();
    if (filterString) url += `&${filterString}`;

    await downloadFile(url, token, "pst_export.zip");
  },
};
