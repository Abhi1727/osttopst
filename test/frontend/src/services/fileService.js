import { API_BASE_URL, getHeaders } from "./api";

// ======== CONFIGURATION ========
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB per chunk (Better for large files)
const MAX_RETRIES = 5; // Retry each chunk up to 5 times
const RETRY_DELAY_MS = 3000; // Wait 3 seconds between retries
const SMALL_FILE_THRESHOLD = 20 * 1024 * 1024; // Files under 20MB use single upload

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
 * Upload a single chunk via XHR with progress + retry logic.
 * Returns a promise that resolves when the chunk is uploaded.
 */
function uploadChunkWithRetry(
  uploadId,
  chunkIndex,
  chunkBlob,
  tokenOrProvider,
  retries = MAX_RETRIES,
) {
  return new Promise((resolve, reject) => {
    const attempt = async (attemptsLeft) => {
      try {
        const token = await resolveToken(tokenOrProvider);
        const xhr = new XMLHttpRequest();
        xhr.timeout = 300000; // 5 minutes per chunk to handle slow speeds

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
          } else if (xhr.status >= 400 && xhr.status < 500) {
            // Do not retry client errors (e.g. invalid file, unauthorized)
            try {
              const resp = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  resp.error || `Upload rejected (status ${xhr.status})`,
                ),
              );
            } catch {
              reject(new Error(`Upload rejected (status ${xhr.status})`));
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
      } catch (err) {
        // Handle token resolution errors
        console.error(`Token resolution failed for chunk ${chunkIndex}:`, err);
        if (attemptsLeft > 1) {
          setTimeout(() => attempt(attemptsLeft - 1), RETRY_DELAY_MS);
        } else {
          reject(err);
        }
      }
    };

    attempt(retries);
  });
}

/**
 * Chunked upload: Split file → init → upload chunks sequentially → finalize.
 * onProgress receives { phase, percent, detail } for granular UI updates.
 */
async function chunkedUpload(
  file,
  tokenOrProvider,
  onProgress,
  password = null,
  signal = null,
) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadId = null;

  const checkAbort = () => {
    if (signal?.aborted) {
      throw new Error("Upload cancelled");
    }
  };

  onProgress({
    phase: "init",
    percent: 0,
    detail: `Initializing upload (${totalChunks} chunks)...`,
  });

  // Step 1: Initialize upload session
  const token = await resolveToken(tokenOrProvider);
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

  const initData = await initRes.json();
  uploadId = initData.uploadId;

  try {
    checkAbort();

    // Step 2: Upload chunks with parallel concurrency
    const MAX_CONCURRENT_UPLOADS = 4; // Increased concurrency for speed
    const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
    const results = [];

    const uploadNext = async () => {
      while (chunkIndices.length > 0 && !signal?.aborted) {
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

        await uploadChunkWithRetry(
          uploadId,
          i,
          chunkBlob,
          tokenOrProvider,
          MAX_RETRIES,
          signal,
        );
        results.push(i);
      }
    };

    // Start concurrent workers
    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENT_UPLOADS, totalChunks) },
      () => uploadNext(),
    );
    await Promise.all(workers);
    checkAbort();

    onProgress({
      phase: "finalizing",
      percent: 95,
      detail: "Assembling file on server...",
    });

    // Step 3: Finalize - merge chunks
    const finalToken = await resolveToken(tokenOrProvider);
    const finalRes = await fetch(
      `${API_BASE_URL}/file-details/upload/${uploadId}/finalize`,
      {
        method: "POST",
        headers: getHeaders(finalToken),
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
        checkAbort();
        onProgress({
          phase: "finalizing",
          percent: 95 + Math.min(attempts, 4), // Visual progress during assembly
          detail: "Assembling file on server...",
        });

        await sleep(5000); // Wait 5 seconds between polls
        checkAbort();
        attempts++;

        const checkToken = await resolveToken(tokenOrProvider);
        const checkRes = await fetch(
          `${API_BASE_URL}/sessions/${result.sessionId}/check`,
          {
            headers: getHeaders(checkToken),
            signal: signal,
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
  } catch (err) {
    if (signal?.aborted && uploadId) {
      // Cleanup on server
      fileService.cancelChunkedUpload(uploadId, tokenOrProvider);
    }
    throw err;
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
function singleUpload(
  file,
  tokenOrProvider,
  onProgress,
  password = null,
  signal = null,
) {
  return new Promise((resolve, reject) => {
    // Wrap in async function to handle token resolution
    const startUpload = async () => {
      try {
        const token = await resolveToken(tokenOrProvider);
        const xhr = new XMLHttpRequest();
        xhr.timeout = 300000; // 5 minutes

        if (signal) {
          signal.addEventListener("abort", () => {
            xhr.abort();
            reject(new Error("Upload cancelled"));
          });
          if (signal.aborted) {
            xhr.abort();
            reject(new Error("Upload cancelled"));
            return;
          }
        }

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
              onProgress({
                phase: "complete",
                percent: 100,
                detail: "Complete!",
              });
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
            new Error(
              "Network error. Please check your connection and try again.",
            ),
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
      } catch (err) {
        reject(err);
      }
    };
    startUpload();
  });
}

export const fileService = {
  /**
   * Smart upload: automatically chooses single upload for small files
   * and chunked upload for large files.
   *
   * @param {File} file - The file to upload
   * @param {string|Function} tokenOrProvider - Auth token or async function returning token
   * @param {Function} onProgress - Progress callback receiving { phase, percent, detail }
   * @param {string} password - Optional PST password
   * @param {AbortSignal} signal - Optional AbortSignal for cancellation
   */
  async uploadFile(
    file,
    tokenOrProvider,
    onProgress,
    password = null,
    signal = null,
  ) {
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
      return await chunkedUpload(
        file,
        tokenOrProvider,
        progressHandler,
        password,
        signal,
      );
    } else {
      // Small file → single request (faster for small files)
      return await singleUpload(
        file,
        tokenOrProvider,
        progressHandler,
        password,
        signal,
      );
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
  },

  async cancelChunkedUpload(uploadId, getToken) {
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
  },

  async exportAll(sessionId, format, excludeEmpty, token) {
    const url = `${API_BASE_URL}/file-details/${sessionId}/export?format=${format}&excludeEmptyFolders=${excludeEmpty}&token=${token}`;
    window.location.href = url;
  },
};
