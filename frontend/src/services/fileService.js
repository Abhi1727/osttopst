import { API_BASE_URL, getHeaders } from "./api";
import { conversionService } from "./conversionService";

// ======== CONFIGURATION ========
// (Constants moved/removed as direct R2 upload is now the primary path)


/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to get a valid token whether a string or function is passed
async function resolveToken(tokenOrProvider) {
  if (typeof tokenOrProvider === "function") {
    return await tokenOrProvider();
  }
  return tokenOrProvider;
}

/**
 * Direct Upload to R2 via Presigned URL.
 * The bytes travel directly from browser to Cloudflare R2.
 */
export const directR2Upload = async (
  file,
  tokenOrProvider,
  onProgress,
  userId,
  signal = null,
  email = null
) => {
  onProgress({ phase: "init", percent: 0, detail: "Requesting secure upload link..." });

  // 1. Get Presigned URL from Backend
  const token = await resolveToken(tokenOrProvider);
  const emailParam = email ? `&email=${encodeURIComponent(email)}` : "";
  const urlRes = await fetch(
    `${API_BASE_URL}/storage/presigned-upload?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type || "application/octet-stream")}${emailParam}`,
    { headers: getHeaders(token) }
  );

  if (!urlRes.ok) throw new Error("Failed to get upload link");
  const { url, key, sessionId } = await urlRes.json();

  // 2. Upload directly to R2
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (signal) {
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Upload cancelled"));
      });
    }

    xhr.open("PUT", url);
    // Note: We MUST set the content type exactly as we did when generating the URL
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress({ phase: "uploading", percent, detail: `Uploading to Cloud... ${percent}%` });
      }
    });

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress({ phase: "finalizing", percent: 99, detail: "Verifying upload..." });

        // 3. Finalize on Backend (Mirror to Azure + Register Session)
        try {
          const finalRes = await fetch(`${API_BASE_URL}/storage/finalize-external-upload`, {
            method: "POST",
            headers: { ...getHeaders(token), "Content-Type": "application/json" },
            body: JSON.stringify({
              key,
              originalFileName: file.name,
              userId: userId,
              size: file.size,
              sessionId: sessionId, // Required by backend for hierarchical storage
              email: email
            })
          });

          if (!finalRes.ok) {
             const errorData = await finalRes.json().catch(() => ({}));
             throw new Error(errorData.error || "Failed to finalize upload on server");
          }
          const result = await finalRes.json();
          onProgress({ phase: "complete", percent: 100, detail: "Upload successful!" });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`Cloud upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during cloud upload"));
    xhr.send(file);
  });
};


/**
 * Main upload function.
 * Uses Direct Cloud Upload for all files now.
 */
export const uploadFile = async (
  file,
  tokenOrProvider,
  onProgress,
  userId,
  password = null,
  signal = null,
  email = null,
  purpose = "Conversion",
) => {
  const progressHandler = (info) => {
    if (typeof info === "object") {
      onProgress(info);
    } else {
      onProgress({ phase: "uploading", percent: info, detail: `${info}%` });
    }
  };

  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
  console.log(`[FileService] Direct Cloud Upload for "${file.name}" (${fileSizeMB} MB)`);

  return await directR2Upload(
    file,
    tokenOrProvider,
    progressHandler,
    userId,
    signal,
    email
  );
};



export const getFolders = async (sessionId, token, excludeEmpty = true) => {
  const response = await fetch(
    `${API_BASE_URL}/file-details/${sessionId}/folders?excludeEmptyFolders=${excludeEmpty}`,
    {
      headers: getHeaders(token),
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch folders");
  }
  return await response.json();
};

export const getMessages = async (
  sessionId,
  folderId,
  token,
  filter = {},
  sortBy = "date",
  sortOrder = "desc",
) => {
  const params = new URLSearchParams({
    folderId,
    sortBy,
    sortOrder,
  });
  if (filter.year) params.append("year", filter.year);
  if (filter.month) params.append("month", filter.month);
  if (filter.startDate) params.append("startDate", filter.startDate);
  if (filter.endDate) params.append("endDate", filter.endDate);

  const response = await fetch(
    `${API_BASE_URL}/file-details/${sessionId}/messages?${params.toString()}`,
    {
      headers: getHeaders(token),
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch messages");
  }
  return await response.json();
};

export const deleteSession = async (sessionId, token) => {
  try {
    await fetch(`${API_BASE_URL}/file-details/${sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      keepalive: true,
    });
  } catch (err) {
    console.warn("[FileService] Background deletion failed:", err);
  }
};

export const cancelChunkedUpload = async (uploadId, getToken) => {
  try {
    const token = await resolveToken(getToken);
    await fetch(`${API_BASE_URL}/file-details/upload/${uploadId}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    console.log(`[FileService] Cancelled chunked upload: ${uploadId}`);
  } catch (err) {
    console.warn(
      `[FileService] Failed to cancel chunked upload ${uploadId}:`,
      err,
    );
  }
};

export const getMessageDetail = async (sessionId, entryId, token) => {
  const encodedEntryId = encodeURIComponent(entryId);
  const response = await fetch(
    `${API_BASE_URL}/file-details/${sessionId}/messages/detail?entryId=${encodedEntryId}`,
    {
      headers: getHeaders(token),
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch message details");
  }
  return await response.json();
};

export const exportAll = async (sessionId, format, excludeEmpty, token, email = null) => {
  return await conversionService.exportAll(
    sessionId,
    format,
    excludeEmpty,
    token,
    null, // onProgress
    null, // signal
    { email },
  );
};

export const validateFileIntegrity = async (file) => {
  if (!file) return { valid: false, error: "No file selected." };
  if (file.size === 0) return { valid: false, error: "The selected file is empty." };

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const header = new Uint8Array(e.target.result);
      const magic = Array.from(header)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

      if (magic === "2142444E") {
        resolve({ valid: true });
      } else {
        resolve({
          valid: false,
          error: "Invalid file format. The uploaded file is not a genuine OST or PST archive.",
        });
      }
    };
    reader.onerror = () =>
      resolve({ valid: false, error: "Failed to read file integrity." });
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};

// Legacy compatibility object export (for existing code)
export const fileService = {
  uploadFile,
  getFolders,
  getMessages,
  deleteSession,
  cancelChunkedUpload,
  getMessageDetail,
  exportAll,
  validateFileIntegrity,
};
