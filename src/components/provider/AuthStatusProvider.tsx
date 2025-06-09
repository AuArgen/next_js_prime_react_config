// src/app/providers/AuthStatusProvider.tsx
'use client';

import {useEffect} from 'react';
import {useUserStore} from '@/app/store/useUserStore';
import {api} from '@/lib/api'; // Сиздин Axios инстанцияңыз

interface AuthStatusProviderProps {
    children: React.ReactNode;
}

export function AuthStatusProvider({children}: AuthStatusProviderProps) {
    const {isLoadingUser, user, setUser, clearUser} = useUserStore();

    useEffect(() => {
        async function checkAuthAndFetchUser() {
            // Эгер колдонуучу маалыматы жүктөлүп жатса, кайтаруу
            if (isLoadingUser) return;

            // Колдонуучунун статусун текшерүү үчүн сервердик API'га чалуу
            // (Бул API httpOnly кукилерди окуй алат)
            try {
                // isLoadingUser'ды fetchUser функциясы башкаргандыктан, бул жерде чакырбайбыз
                // Бирок, эгер fetchUser азыркы логикага дал келбесе,
                // бул жерде setLoading(true) кылып, анан setLoading(false) кылабыз
                // Бирок, useUserStore'дун fetchUser'ы isLoadingUser'ды башкаргандыктан, аны колдонуу жетиштүү.

                const res = await api.get('/v1/v1/user'); // `/api/auth/status` API роутуңузга чалуу
                const get_user = res.data;

                if (get_user && get_user.id) {
                    // Эгер колдонуучу аутентификацияланган болсо жана маалымат бар болсо
                    setUser(get_user); // User store'го сактоо
                    console.log("Колдонуучу маалыматы жүктөлдү:");
                } else {
                    // Эгер аутентификацияланган эмес болсо же user маалыматы жок болсо
                    if (user) { // Эгер мурун user бар болсо, аны тазалоо
                        clearUser();
                        console.log("Колдонуучу системадан чыгып кетти (же сессиясы бүттү).");
                    }
                }
            } catch (error) {
                console.error("Аутентификация статусун текшерүүдө ката кетти:", error);
                if (user) {
                    clearUser(); // Ката болсо да user'ди тазалоо
                }
            }
        }

        // Компонент жүктөлгөндө же user/isLoadingUser өзгөргөндө текшерүү
        if (!user)
            checkAuthAndFetchUser();

        // Dependency array'ден getCookie'ни алып салуу керек, анткени ал мындан ары колдонулбайт.
        // user, isLoadingUser, setUser, clearUser функцияларын dependency'ге кошууну унутпаңыз
        // (алар useUserStore'дон келет, ошондуктан алар туруктуу).
    }, [user, isLoadingUser, setUser, clearUser]); // fetchUser'ды да кошо алабыз, бирок ал да туруктуу.

    // Жүктөө абалын же колдонуучунун маалыматын күтүп жатканда UI көрсөтүү
    if (isLoadingUser) {
        return <div>Жүктөлүүдө...</div>; // Же кандайдыр бир Loading Spinner
    }

    return <>{children}</>;
}