// Keep requests same-origin. Vite forwards /api to Express in development.
export const TOKEN_KEY = "consultify.token";
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};
export async function request(
  path,
  { method = "GET", body, auth = true, signal } = {},
) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? tokenStore.get() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal || AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "We could not reach Consultify. Check your connection and try again.",
    );
  }
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* Report non-JSON below without exposing an HTML error page. */
  }
  if (!response.ok) {
    if (response.status === 401 && token) {
      // A late response from a previous session must not clear a newer login.
      if (tokenStore.get() === token) {
        tokenStore.clear();
        window.dispatchEvent(new Event("consultify:expired"));
      }
    }
    throw new ApiError(
      data?.message ||
        (response.status >= 500
          ? "The service is temporarily unavailable. Please try again."
          : `Request failed (${response.status}). Please try again.`),
      response.status,
    );
  }
  if (text && data === null)
    throw new ApiError(
      "The server returned an unexpected response. Please try again.",
      response.status,
    );
  return data ?? {};
}
export const query = (values) => {
  const q = new URLSearchParams(Object.entries(values).filter(([, v]) => v));
  return q.size ? `?${q}` : "";
};
export const health = () => request("/health", { auth: false });
