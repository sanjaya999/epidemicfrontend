import { api } from "@/lib/api";

export const authService = {
  register: async (data: any) => {
    return api.post("/users/register", data);
  },

  login: async (data: any) => {
    return api.post("/users/login", data);
  },

  logout: async () => {
    return api.post("/users/logout");
  },

  getMe: async () => {
    return api.get("/users/me");
  },
};
