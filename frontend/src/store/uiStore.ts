import { create } from 'zustand';

interface UIState {
  navOpen: boolean;
  setNavOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  navOpen: false,
  setNavOpen: (v) => set({ navOpen: v }),
}));
