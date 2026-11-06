import { request } from "./client";
export const authApi = {
  register: (body, advisor = false) =>
    request(`/auth/register${advisor ? "/advisor" : ""}`, {
      method: "POST",
      body,
      auth: false,
    }),
  login: (body) =>
    request("/auth/login", { method: "POST", body, auth: false }),
  me: () => request("/auth/me"),
};
