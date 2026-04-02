import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/") {
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  verifyEmail: (data) => api.post("/auth/verify-email", data),
  resendVerification: (data) => api.post("/auth/resend-verification", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

export const lessonsAPI = {
  list: () => api.get("/lessons"),
  get: (id) => api.get(`/lessons/${id}`),
  complete: (id) => api.post(`/lessons/${id}/complete`),
};

export const quizAPI = {
  get: (lessonId) => api.get(`/quiz/${lessonId}`),
  submit: (data) => api.post("/quiz/submit", data),
};

export const codeAPI = {
  run: (data) => api.post("/code/run", data),
};

export const dailyAPI = {
  get: () => api.get("/daily"),
  complete: () => api.post("/daily/complete"),
};

export const leaderboardAPI = {
  get: () => api.get("/leaderboard"),
};

export const aiAPI = {
  tutor: (data) => api.post("/ai/tutor", data),
};

export const userAPI = {
  profile: () => api.get("/user/profile"),
  updateProfile: (data) => api.put("/user/profile", data),
  updateAvatar: (data) => api.post("/user/avatar", data),
  stats: () => api.get("/user/stats"),
  progress: () => api.get("/user/progress"),
};

export const developerAPI = {
  check: () => api.get("/user/admin/check"),
  listUsers: () => api.get("/user/admin/users"),
  updateUser: (userId, data) => api.put(`/user/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/user/admin/users/${userId}`),
};

export function formatApiError(detail) {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
