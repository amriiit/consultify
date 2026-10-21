import { request } from "./client";
export const authApi = {
  register: (body, advisor = false) =>
    request(`/auth/register${advisor ? "/advisor" : ""}`, {
      method: "POST",
      body,
    }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: (signal) => request("/auth/me", { auth: true, signal }),
};
