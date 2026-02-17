import { API_BASE_URL, getHeaders } from "./api";

// ======== CONFIGURATION ========
const CHUNK_SIZE = 50 * 1024 * 1024; // 50 MB per chunk (Optimized for performance)
const MAX_RETRIES = 3; // Retry each chunk up to 3 times
const RETRY_DELAY_MS = 2000; // Wait 2 seconds between retries
const SMALL_FILE_THRESHOLD = 20 * 1024 * 1024; // Files under 20MB use single upload

/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload a single chunk via XHR with progress + retry logic.
 * Returns a promise that resolves when the chunk is uploaded.
 */
function uploadChunkWithRetry(
  uploadId,
  chunkIndex,
  chunkBlob,
  token,
  retries = MAX_RETRIES,
) {
  return new Promise((resolve, reject) => {
    const attempt = (attemptsLeft) => {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 120000; // 2 minutes per chunk

      xhr.open(
        "POST",
        `${API_BASE_URL}/file-details/upload/${uploadId}/chunk/${chunkIndex}`,
      );
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve({ success: true, chunkIndex });
          }
        } else if (attemptsLeft > 1) {
          console.warn(
            `Chunk ${chunkIndex} failed (status ${xhr.status}), retrying... (${attemptsLeft - 1} left)`,
          );
          setTimeout(() => attempt(attemptsLeft - 1), RETRY_DELAY_MS);
        } else {
          reject(
            new Error(
              `Chunk ${chunkIndex} failed after ${retries} attempts (status: ${xhr.status})`,
            ),
          );
        }
      });

      xhr.addEventListener("error", () => {
        if (attemptsLeft > 1) {
          console.warn(
            `Chunk ${chunkIndex} network error, retrying... (${attemptsLeft - 1} left)`,
          );
          setTimeout(() => attempt(attemptsLeft - 1), RETRY_DELAY_MS);
        } else {
          reject(
            new Error(
              `Chunk ${chunkIndex} failed after ${retries} attempts (network error)`,
            ),
          );
        }
      });

      xhr.addEventListener("timeout", () => {
        if (attemptsLeft > 1) {
          console.warn(
            `Chunk ${chunkIndex} timeout, retrying... (${attemptsLeft - 1} left)`,
          );
          setTimeout(() => attempt(attemptsLeft - 1), RETRY_DELAY_MS);
        } else {
          reject(
            new Error(
              `Chunk ${chunkIndex} timed out after ${retries} attempts`,
            ),
          );
        }
      });

      const formData = new FormData();
      formData.append("chunk", chunkBlob, `chunk_${chunkIndex}`);
      xhr.send(formData);
    };

    attempt(retries);
  });
}

/**
 * Chunked upload: Split file → init → upload chunks sequentially → finalize.
 * onProgress receives { phase, percent, detail } for granular UI updates.
 */
async function chunkedUpload(file, token, onProgress, password = null) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  onProgress({
    phase: "init",
    percent: 0,
    detail: `Initializing upload (${totalChunks} chunks)...`,
  });

  // Step 1: Initialize upload session
  const initRes = await fetch(`${API_BASE_URL}/file-details/upload/init`, {
    method: "POST",
    headers: {
      ...getHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      FileName: file.name,
      TotalChunks: totalChunks,
      TotalSize: file.size,
      Password: password || null,
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error || "Failed to initialize upload");
  }

  const { uploadId } = await initRes.json();

  // Step 2: Upload chunks with parallel concurrency
  const MAX_CONCURRENT_UPLOADS = 3;
  const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
  const results = [];

  const uploadNext = async () => {
    while (chunkIndices.length > 0) {
      const i = chunkIndices.shift();
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBlob = file.slice(start, end);

      const percent = Math.round((results.length / totalChunks) * 100);
      onProgress({
        phase: "uploading",
        percent,
        detail: `Uploading chunk ${results.length + 1} of ${totalChunks}...`,
        chunkIndex: i,
        totalChunks,
      });

      await uploadChunkWithRetry(uploadId, i, chunkBlob, token);
      results.push(i);
    }
  };

  // Start concurrent workers
  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT_UPLOADS, totalChunks) },
    () => uploadNext(),
  );
  await Promise.all(workers);

  onProgress({
    phase: "finalizing",
    percent: 95,
    detail: "Assembling file on server...",
  });

  // Step 3: Finalize - merge chunks
  const finalRes = await fetch(
    `${API_BASE_URL}/file-details/upload/${uploadId}/finalize`,
    {
      method: "POST",
      headers: getHeaders(token),
    },
  );

  if (!finalRes.ok) {
    const err = await finalRes.json().catch(() => ({}));
    throw new Error(err.error || "Failed to finalize upload");
  }

  const initialResult = await finalRes.json();
  let result = initialResult;

  // Step 4: Poll for completion if status is "Assembling"
  if (result.status === "Assembling") {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max polling (5s intervals)

    while (result.status === "Assembling" && attempts < maxAttempts) {
      onProgress({
        phase: "finalizing",
        percent: 95 + Math.min(attempts, 4), // Visual progress during assembly
        detail: "Assembling file on server...",
      });

      await sleep(5000); // Wait 5 seconds between polls
      attempts++;

      const checkRes = await fetch(
        `${API_BASE_URL}/sessions/${result.sessionId}/check`,
        {
          headers: getHeaders(token),
        },
      );

      if (checkRes.ok) {
        result = await checkRes.json();
        // If status is "Uploaded", we are done
      }
    }

    if (result.status === "AssemblyFailed") {
      throw new Error("File assembly failed on server. Please try again.");
    }
  }

  onProgress({
    phase: "complete",
    percent: 100,
    detail: "Upload complete! Redirecting...",
  });

  // Wait 3 seconds before finishing to let user see 100%
  await sleep(3000);

  return result;
}

/**
 * Legacy single-file upload via XHR (for small files under threshold).
 */
function singleUpload(file, token, onProgress, password = null) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 300000; // 5 minutes

    xhr.open("POST", `${API_BASE_URL}/file-details/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress({
          phase: "uploading",
          percent,
          detail: `Uploading... ${percent}%`,
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          onProgress({ phase: "complete", percent: 100, detail: "Complete!" });
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Invalid server response."));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(
        new Error("Network error. Please check your connection and try again."),
      );
    });

    xhr.addEventListener("timeout", () => {
      reject(new Error("Upload timed out. The file may be too large."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled."));
    });

    const formData = new FormData();
    formData.append("file", file);
    if (password) formData.append("password", password);
    xhr.send(formData);
  });
}

export const fileService = {
  /**
   * Smart upload: automatically chooses single upload for small files
   * and chunked upload for large files.
   *
   * @param {File} file - The file to upload
   * @param {string} token - Auth token
   * @param {Function} onProgress - Progress callback receiving { phase, percent, detail }
   * @param {string} password - Optional PST password
   */
  async uploadFile(file, token, onProgress, password = null) {
    // Normalize onProgress to handle both old-style (percent) and new-style ({ phase, percent, detail })
    const progressHandler = (info) => {
      if (typeof info === "object") {
        onProgress(info);
      } else {
        onProgress({ phase: "uploading", percent: info, detail: `${info}%` });
      }
    };

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    console.log(
      `[FileService] Uploading "${file.name}" (${fileSizeMB} MB), using ${file.size > SMALL_FILE_THRESHOLD ? "chunked" : "single"} mode`,
    );

    if (file.size > SMALL_FILE_THRESHOLD) {
      // Large file → chunked upload with retry
      return await chunkedUpload(file, token, progressHandler, password);
    } else {
      // Small file → single request (faster for small files)
      return await singleUpload(file, token, progressHandler, password);
    }
  },

  async getFolders(sessionId, token, excludeEmpty = false) {
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
  },

  async getMessages(sessionId, folderId, token) {
    const response = await fetch(
      `${API_BASE_URL}/file-details/${sessionId}/messages?folderId=${encodeURIComponent(folderId)}`,
      {
        headers: getHeaders(token),
      },
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to fetch messages");
    }
    return await response.json();
  },

  async deleteSession(sessionId, token) {
    await fetch(`${API_BASE_URL}/file-details/${sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async exportAll(sessionId, format, excludeEmpty, token) {
    const url = `${API_BASE_URL}/file-details/${sessionId}/export?format=${format}&excludeEmptyFolders=${excludeEmpty}&token=${token}`;
    window.location.href = url;
  },
};
