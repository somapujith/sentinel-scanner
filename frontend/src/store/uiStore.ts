import { create } from 'zustand';

type Language = 'en' | 'cn' | 'th' | 'vn';

interface UIState {
  navOpen: boolean;
  language: Language;
  setNavOpen: (v: boolean) => void;
  setLanguage: (lang: Language) => void;
}

export const useUIStore = create<UIState>((set) => ({
  navOpen: false,
  language: 'en',
  setNavOpen: (v) => set({ navOpen: v }),
  setLanguage: (lang) => set({ language: lang }),
}));
