const AUTH_KEY = "behind-nb-auth";

export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    try {
      const configuredHost = new URL(configuredUrl).hostname.toLowerCase().replace(/^\[|\]$/g, "");
      if (["localhost", "127.0.0.1", "::1"].includes(configuredHost)) return "/api";
    } catch {
      // Keep relative API paths as configured.
    }
    return configuredUrl.replace(/\/$/, "");
  }
  return "/api";
}

export function getAuthSession() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

export function setAuthSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("behind-nb-auth-changed"));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event("behind-nb-auth-changed"));
}

export async function apiRequest(path, options = {}) {
  const { body, headers = {}, ...requestOptions } = options;
  const session = getAuthSession();
  const requestHeaders = { ...headers };
  let requestBody = body;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData && typeof body !== "string") {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }
  if (session?.token && !requestHeaders.Authorization) {
    requestHeaders.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    body: requestBody,
  });
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const message = typeof payload === "string"
      ? payload
      : payload.message || payload.error || "คำขอไม่สำเร็จ กรุณาลองอีกครั้ง";
    throw new Error(message);
  }
  return payload;
}

export function apiData(payload) {
  return payload?.data ?? payload;
}
