import { create } from 'zustand';

type GlobalLoadingStoreState = {
    status: boolean;
    active: () => void;
    inactive: () => void;
};

export const useGlobalLoadingStore = create<GlobalLoadingStoreState>((set) => ({
    status: false,
    active: () => set(() => ({ status: true })),
    inactive: () => set(() => ({ status: false })),
}));
