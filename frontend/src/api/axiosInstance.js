// frontend/src/api/axiosInstance.js

export function getApiBaseUrl() {
  // 1. ในเบราว์เซอร์ ใช้ /api เพื่อให้ Next.js rewrites จัดการส่งต่อ backend โดยตรง (แก้ปัญหา Load failed / CORS บนมือถือ)
  if (typeof window !== "undefined") {
    return "/api";
  }

  // 2. หากตั้งค่า NEXT_PUBLIC_API_URL ให้ใช้ค่านั้น
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  return "http://127.0.0.1:5000/api";
}

/**
 * ดึง Token ของ Role ที่ระบุจาก localStorage
 */
export function getToken(role = "CUSTOMER") {
  if (typeof window === "undefined") return null;
  const roleKey = `${role.toLowerCase()}_token`;
  return localStorage.getItem(roleKey) || localStorage.getItem("token") || null;
}

/**
 * บันทึก Token ลง localStorage
 */
export function setToken(token, role = "CUSTOMER") {
  if (typeof window === "undefined") return;
  const roleKey = `${role.toLowerCase()}_token`;
  localStorage.setItem(roleKey, token);
  localStorage.setItem("token", token);
}

/**
 * ลบ Token
 */
export function clearToken(role = "CUSTOMER") {
  if (typeof window === "undefined") return;
  const roleKey = `${role.toLowerCase()}_token`;
  localStorage.removeItem(roleKey);
  localStorage.removeItem("token");
}

/**
 * ส่ง Request ไปยัง Backend API
 */
export async function apiRequest(path, options = {}, role = "CUSTOMER") {
  const token = getToken(role);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const API_URL = getApiBaseUrl();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const errorMsg = 
      data?.message || 
      data?.error || 
      (typeof data === "string" ? data : `API Error: ${response.status}`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.details = data?.details || null;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, options = {}, role) => apiRequest(path, { ...options, method: "GET" }, role),
  post: (path, body, options = {}, role) => 
    apiRequest(path, { 
      ...options, 
      method: "POST", 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }, role),
  put: (path, body, options = {}, role) => 
    apiRequest(path, { 
      ...options, 
      method: "PUT", 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }, role),
  patch: (path, body, options = {}, role) => 
    apiRequest(path, { 
      ...options, 
      method: "PATCH", 
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined 
    }, role),
  delete: (path, options = {}, role) => apiRequest(path, { ...options, method: "DELETE" }, role),
};

export default api;
