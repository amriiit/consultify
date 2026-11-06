import { request, query } from "./client";
export const communityApi = {
  list: (filters) =>
    request(`/community/posts${query(filters || {})}`, { auth: false }),
  detail: (id) =>
    request(`/community/posts/${encodeURIComponent(id)}`, { auth: false }),
  create: (body) => request("/community/posts", { method: "POST", body }),
  comments: (id) =>
    request(`/community/posts/${encodeURIComponent(id)}/comments`, {
      auth: false,
    }),
  comment: (id, content) =>
    request(`/community/posts/${id}/comments`, {
      method: "POST",
      body: { content },
    }),
  helpful: (id) =>
    request(`/community/posts/${id}/helpful`, { method: "POST" }),
  deleteComment: (id) =>
    request(`/community/comments/${id}`, { method: "DELETE" }),
  deletePost: (id) => request(`/community/posts/${id}`, { method: "DELETE" }),
};
