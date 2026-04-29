import { create } from "zustand";

interface User {
  username: string;
  email: string;
  id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
