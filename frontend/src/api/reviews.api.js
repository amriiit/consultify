import { request } from "./client";
export const reviewsApi = {
  create: (body) => request("/reviews", { method: "POST", body, auth: true }),
};
