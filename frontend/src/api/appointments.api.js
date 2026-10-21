import { request } from "./client";
export const appointmentsApi = {
  list: (advisor, signal) =>
    request(`/appointments/${advisor ? "advisor" : "user"}`, {
      auth: true,
      signal,
    }),
  book: (body) =>
    request("/appointments", { method: "POST", body, auth: true }),
  cancel: (id) =>
    request(`/appointments/${id}/cancel`, { method: "PATCH", auth: true }),
  status: (id, status) =>
    request(`/appointments/${id}/status`, {
      method: "PATCH",
      body: { status },
      auth: true,
    }),
};
