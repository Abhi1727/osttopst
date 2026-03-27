import { API_BASE_URL, getHeaders, handleResponse } from "./api";

const licenseService = {
  /**
   * Fetches the current license status from the backend.
   * @param {string} token - Optional auth token for private license checks
   * @returns {Promise<Object>} The license status object.
   */
  getLicenseStatus: async (token, email, itemId = null) => {
    try {
      let url = `${API_BASE_URL}/license/status`;
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (itemId) params.append("itemId", itemId);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Do NOT send the Authorization header here — this endpoint is AllowAnonymous
      // and only uses the email query param. Sending a JWT (even a valid one from a
      // different Clerk instance) triggers the auth middleware challenge and returns 401.
      const res = await fetch(url, {
        headers: {},
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error fetching license status:", error);
      // Return a default demo-expired-like state if the call fails
      return {
        tier: "DemoExpired",
        status: "NotSubscribed",
        canConvert: false,
        message: "Unable to verify license.",
      };
    }
  },

  /**
   * Generates a subscription request for a specific plan.
   * @param {string} token - Auth token
   * @param {Object} requestData - { TotalItems, Storage, TotalDays, PlanId, ModuleId }
   * @param {string} email - Optional email override
   * @returns {Promise<Object>} The response from the server.
   */
  generateSubscriptionRequest: async (token, requestData, email) => {
    try {
      const url = email
        ? `${API_BASE_URL}/license/subscription?email=${encodeURIComponent(email)}`
        : `${API_BASE_URL}/license/subscription`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...getHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error generating subscription request:", error);
      throw error;
    }
  },
};

export default licenseService;
