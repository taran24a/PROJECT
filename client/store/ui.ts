import { create } from "zustand";

type ThemeMode = 'dark' | 'midnight' | 'deepblue';

interface UIState {
  masked: boolean; // masks sensitive amounts (e.g., show ••••)
  panic: boolean; // blur all numbers immediately
  commandOpen: boolean;
  theme: ThemeMode;
  globalLoading: boolean;
  setMasked: (v: boolean) => void;
  toggleMasked: () => void;
  setPanic: (v: boolean) => void;
  togglePanic: () => void;
  setCommandOpen: (v: boolean) => void;
  setTheme: (t: ThemeMode) => void;
  setGlobalLoading: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  masked: false,
  panic: false,
  commandOpen: false,
  theme: (typeof window !== 'undefined' && (localStorage.getItem('ui_theme') as ThemeMode)) || 'dark',
  globalLoading: false,
  setMasked: (v) => set({ masked: v }),
  toggleMasked: () => set((s) => ({ masked: !s.masked })),
  setPanic: (v) => set({ panic: v }),
  togglePanic: () => set((s) => ({ panic: !s.panic })),
  setCommandOpen: (v) => set({ commandOpen: v }),
  setTheme: (t) => {
    if (typeof window !== 'undefined') localStorage.setItem('ui_theme', t);
    set({ theme: t });
  },
  setGlobalLoading: (v) => set({ globalLoading: v }),
}));
