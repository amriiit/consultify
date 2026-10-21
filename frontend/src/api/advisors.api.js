import { request, query } from "./client";
export const advisorsApi = {
  list: (filters = {}, signal) =>
    request(`/advisors${query(filters)}`, { signal }),
  detail: (id, signal) =>
    request(`/advisors/${encodeURIComponent(id)}`, { signal }),
  reviews: (id, signal) =>
    request(`/advisors/${encodeURIComponent(id)}/reviews`, { signal }),
  save: (body, exists) =>
    request("/advisors/profile", {
      method: exists ? "PATCH" : "POST",
      body,
      auth: true,
    }),
};
