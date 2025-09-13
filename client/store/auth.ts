import { create } from "zustand";

type User = { id: string; email: string; name?: string } | null;

interface AuthState {
  user: User;
  token: string | null;
  setSession: (u: User, t: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState & { hydrated: boolean }>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  setSession: (user, token) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    set({ user, token, hydrated: true });
  },
  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    set({ user: null, token: null, hydrated: true }); // hydrated but unauthenticated
  },
  hydrate: () => {
    const token = localStorage.getItem("auth_token");
    const raw = localStorage.getItem("auth_user");
    const user = raw ? (JSON.parse(raw) as User) : null;
    set({ token, user, hydrated: true });
  },
}));
