export const TOKEN_KEY = "consultify.session";
let memoryToken;
export function getToken() {
  if (memoryToken !== undefined) return memoryToken;
  try {
    return (memoryToken = sessionStorage.getItem(TOKEN_KEY));
  } catch {
    return (memoryToken = null);
  }
}
export function setToken(token) {
  memoryToken = token;
  try {
    token
      ? sessionStorage.setItem(TOKEN_KEY, token)
      : sessionStorage.removeItem(TOKEN_KEY);
    return true;
  } catch {
    return false;
  }
}
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
export async function request(
  path,
  { method = "GET", body, auth = false, signal } = {},
) {
  const token = auth ? getToken() : null;
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "We couldn’t reach Consultify. Check your connection and try again.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      "The server returned an unexpected response. Please try again.",
      response.status,
    );
  }
  if (!response.ok) {
    if (response.status === 401 && token && getToken() === token)
      window.dispatchEvent(new Event("consultify:expired"));
    throw new ApiError(
      data.message || "The request could not be completed.",
      response.status,
    );
  }
  return data;
}
export const query = (values) => {
  const params = new URLSearchParams(
    Object.entries(values).filter(([, v]) => v !== "" && v != null),
  );
  return params.size ? `?${params}` : "";
};
