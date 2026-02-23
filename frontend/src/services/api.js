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

export const getFolderTree = async (sessionId, token, excludeEmpty = false) => {
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
