import { request, query } from "./client";
export const advisorsApi = {
  list: (filters) =>
    request(`/advisors${query(filters || {})}`, { auth: false }),
  detail: (id) =>
    request(`/advisors/${encodeURIComponent(id)}`, { auth: false }),
  reviews: (id) =>
    request(`/advisors/${encodeURIComponent(id)}/reviews`, { auth: false }),
  create: (body) => request("/advisors/profile", { method: "POST", body }),
  update: (body) => request("/advisors/profile", { method: "PATCH", body }),
};
