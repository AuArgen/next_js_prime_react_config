// src/app/(public)/getlogincode/page.tsx

'use client'; // Бул файл клиенттик компонент экенин көрсөтөт

import { useSearchParams } from "next/navigation";
import { useGlobalLoadingStore } from "@/app/store/useGlobalLoadingStore";
import { useEffect } from "react";
// import { authenticate } from "@/api/auth"; // Эгер колдонулбаса, алып салуу
import { useToast } from "@/components/provider/ToastProvider";
import { useRouter } from 'next/navigation';
import { api } from "@/lib/api"; // Axios инстанцияңыз
import axios from "axios"; // Axios каталарын текшерүү үчүн

export default function LoginCodePage() {
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const { active, inactive } = useGlobalLoadingStore();
    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        // Код жок болсо, дароо башкы бетке багыттоо
        if (!code) {
            toast.showWarn("Авторизация коду табылган жок."); // Эскертүү көрсөтүү
            router.push("/");
            return;
        }

        async function sendToAuthentication() {
            try {
                active(); // Жүктөлүү индикаторун активдештирүү

                // /api/auth/setToken API'сине POST сурамын жөнөтүү
                // `params` ордуна `code`'ду түз эле сурамдын body'сине жөнөтүү
                const res = await api.post("/auth/setToken", { code });

                // API жообун текшерүү
                if (res.status === 200) {
                    toast.showSuccess("Ийгиликтүү авторизациядан өттүңүз!");
                } else {
                    // Эгер статус 200 эмес болсо (мисалы, 400, 500)
                    // Бул Axios interceptors тарабынан иштетилбесе, бул жерде кармалат.
                    console.error("API жообу ийгиликсиз:", res.data);
                    toast.showError(
                        res.data?.message || "Авторизацияда күтүлбөгөн ката кетти."
                    );
                }
            } catch (err) {
                // Каталарды жакшыраак башкаруу
                console.error("Авторизация процессинде ката кетти:", err);

                let errorMessage = "Авторизацияда белгисиз ката кетти.";

                if (axios.isAxiosError(err)) {
                    // Axios катасы болсо (мисалы, 4xx, 5xx статустары)
                    errorMessage = err.response?.data?.message || err.message || errorMessage;
                    // Эгер API'ден "message" талаасы жок болсо, Axios'тун демейки ката билдирүүсүн колдонот
                } else if (err instanceof Error) {
                    // Жалпы JavaScript катасы болсо
                    errorMessage = err.message || errorMessage;
                }

                toast.showError(errorMessage);
            } finally {
                inactive(); // Жүктөлүү индикаторун өчүрүү
                window.location.href='/'; // Ийгиликтүү болсо да, ката кетсе да негизги бетке багыттоо
            }
        }

        sendToAuthentication();
    }, [code, router, active, inactive, toast]); // Dependencies'ге router, active, inactive, toast кошуу

    return null; // Бул бет UI'ды көрсөтпөйт, жөн гана багыттоону башкарат
}