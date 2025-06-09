// src/app/store/useUserStore.ts
import {create} from 'zustand';

interface User {
    id: string;
    name: string;
    email: string;
    // ... башка колдонуучу талаалары
}

interface UserStore {
    user: User | null;
    setUser: (user: User | null) => void;
    clearUser: () => void;
    isLoadingUser: boolean; // Колдонуучу маалыматы жүктөлүп жатканын көрсөтөт
}

export const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    isLoadingUser: false,
    setUser: (user) => set({user}),
    clearUser: () => set({user: null}),
}));
