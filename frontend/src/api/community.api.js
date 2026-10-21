import { request, query } from "./client";
export const communityApi = {
  list: (filters = {}, signal) =>
    request(`/community/posts${query(filters)}`, { signal }),
  detail: (id, signal) =>
    request(`/community/posts/${encodeURIComponent(id)}`, { signal }),
  comments: (id, signal) =>
    request(`/community/posts/${encodeURIComponent(id)}/comments`, { signal }),
  create: (body) =>
    request("/community/posts", {
      method: "POST",
      body: { ...body, domain: "FINANCE" },
      auth: true,
    }),
  comment: (id, content) =>
    request(`/community/posts/${id}/comments`, {
      method: "POST",
      body: { content },
      auth: true,
    }),
  helpful: (id) =>
    request(`/community/posts/${id}/helpful`, { method: "POST", auth: true }),
  deletePost: (id) =>
    request(`/community/posts/${id}`, { method: "DELETE", auth: true }),
  deleteComment: (id) =>
    request(`/community/comments/${id}`, { method: "DELETE", auth: true }),
};
