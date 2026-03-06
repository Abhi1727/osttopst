import { API_BASE_URL, getHeaders, handleResponse } from "./api";

const licenseService = {
  /**
   * Fetches the current license status from the backend.
   * @param {string} token - Optional auth token for private license checks
   * @returns {Promise<Object>} The license status object.
   */
  getLicenseStatus: async (token, email) => {
    try {
      const url = email
        ? `${API_BASE_URL}/license/status?email=${encodeURIComponent(email)}`
        : `${API_BASE_URL}/license/status`;

      const res = await fetch(url, {
        headers: getHeaders(token),
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error fetching license status:", error);
      // Return a default demo-expired-like state if the call fails
      return {
        tier: "DemoExpired",
        canConvert: false,
        message: "Unable to verify license.",
      };
    }
  },
};

export default licenseService;
