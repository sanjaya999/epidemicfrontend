import { api } from "@/lib/api";
import type {
  ApiEnvelope,
  LoginPayload,
  RegisterPayload,
  TokenResponse,
  User,
} from "@/types/auth";

export const authService = {
  register: async (data: RegisterPayload) => {
    return api.post<ApiEnvelope<User>>("/users/register", data);
  },

  login: async (data: LoginPayload) => {
    return api.post<TokenResponse>("/users/login", data);
  },

  logout: async () => {
    return api.post<ApiEnvelope<null>>("/users/logout");
  },

  getMe: async () => {
    return api.get<ApiEnvelope<User>>("/users/me");
  },
};
