import axios from "axios";
import Constants from "expo-constants";

const API_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  Constants.manifest2?.extra?.expoClient?.extra?.apiBaseUrl ||
  "http://localhost:8010";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true
});

export default api;

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  verifyEmail: (data) => api.post("/auth/verify-email", data),
  resendVerification: (data) => api.post("/auth/resend-verification", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data)
};

export const lessonsAPI = {
  list: () => api.get("/lessons"),
  get: (id) => api.get(`/lessons/${id}`),
  complete: (id) => api.post(`/lessons/${id}/complete`)
};

export const quizAPI = {
  get: (lessonId) => api.get(`/quiz/${lessonId}`),
  submit: (data) => api.post("/quiz/submit", data)
};

export const codeAPI = {
  run: (data) => api.post("/code/run", data)
};

export const dailyAPI = {
  get: () => api.get("/daily"),
  complete: () => api.post("/daily/complete")
};

export const leaderboardAPI = {
  get: () => api.get("/leaderboard")
};

export const userAPI = {
  profile: () => api.get("/user/profile"),
  updateProfile: (data) => api.put("/user/profile", data),
  updateSettings: (data) => api.put("/user/settings", data),
  updateAvatar: (data) => api.post("/user/avatar", data),
  stats: () => api.get("/user/stats"),
  progress: () => api.get("/user/progress"),
  friends: () => api.get("/user/friends"),
  friendRequests: () => api.get("/user/friend-requests"),
  publicProfile: (username) => api.get(`/user/by-username/${encodeURIComponent(username)}`),
  sendFriendRequest: (username) => api.post("/user/friend-requests", { username }),
  acceptFriendRequest: (requestId) => api.post(`/user/friend-requests/${requestId}/accept`),
  declineFriendRequest: (requestId) => api.post(`/user/friend-requests/${requestId}/decline`),
  removeFriend: (username) => api.delete(`/user/friends/${encodeURIComponent(username)}`)
};

export const developerAPI = {
  check: () => api.get("/user/admin/check"),
  listUsers: () => api.get("/user/admin/users"),
  updateUser: (userId, data) => api.put(`/user/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/user/admin/users/${userId}`)
};

export function formatApiError(error) {
  const detail = error?.response?.data?.detail;
  if (!detail) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (typeof detail?.message === "string") return detail.message;
  return "Something went wrong.";
}
