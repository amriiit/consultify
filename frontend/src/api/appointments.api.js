import { request } from "./client";
export const appointmentsApi = {
  book: (body) => request("/appointments", { method: "POST", body }),
  list: (role) =>
    request(`/appointments/${role === "ADVISOR" ? "advisor" : "user"}`),
  status: (id, status) =>
    request(`/appointments/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  cancel: (id) => request(`/appointments/${id}/cancel`, { method: "PATCH" }),
};
