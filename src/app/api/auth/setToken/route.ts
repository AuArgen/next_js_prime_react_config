// src/app/api/auth/login/route.ts (мисалы, ушундай жол)

import {NextRequest, NextResponse} from "next/server";
import {api} from "@/lib/api"; // api'ңиз туура импорттолгондугун текшериңиз
import axios from 'axios'; // axios каталарын башкаруу үчүн

export async function POST(req: NextRequest) {
    try {
        const {code} = await req.json();

        // 1. Коддун бар экендигин текшерүү (милдеттүү эмес, бирок пайдалуу)
        if (!code) {
            return NextResponse.json(
                {success: false, message: "Авторизация коду берилген жок."},
                {status: 400} // Bad Request
            );
        }

        const res = await api.get("/v1/authorization/end", {
            params: {code}
        });

        const {access_token, refresh_token, expires_at} = res.data;

        // 2. Токендердин бар экендигин текшерүү
        if (!access_token || !refresh_token || !expires_at) {
            console.error("API'ден жараксыз токендер алынды:", res.data);
            return NextResponse.json(
                {success: false, message: "Авторизация серверинен жараксыз жооп алынды."},
                {status: 500} // Internal Server Error
            );
        }

        const response = NextResponse.json({success: true, message: "Авторизация ийгиликтүү өттү."});

        // Установка HttpOnly cookies
        response.cookies.set("access_token", access_token, {
            httpOnly: true,
            secure: process.env.NEXT_PUBLIC_NODE_ENV === 'production', // Өндүрүштө гана secure
            sameSite: "lax",
            path: "/",
            expires: new Date(Date.now() + expires_at * 1000), // API'ден келген мөөнөтү
        });

        response.cookies.set("refresh_token", refresh_token, {
            httpOnly: true,
            secure: process.env.NEXT_PUBLIC_NODE_ENV === 'production',
            sameSite: "lax",
            path: "/",
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 күн
        });

        return response;

    } catch (error) {
        // 3. Каталарды жакшыраак башкаруу
        console.error("Авторизация процессинде ката кетти:", error);

        if (axios.isAxiosError(error)) {
            // Axios катасы болсо
            const status = error.response?.status || 500;
            const message = error.response?.data?.message || "Авторизация серверинен ката кетти.";
            return NextResponse.json({success: false, message}, {status});
        } else if (error instanceof Error) {
            // Жалпы JavaScript катасы болсо
            return NextResponse.json(
                {success: false, message: error.message || "Белгисиз ката кетти."},
                {status: 500}
            );
        } else {
            // Белгисиз ката түрү болсо
            return NextResponse.json(
                {success: false, message: "Белгисиз ката пайда болду."},
                {status: 500}
            );
        }
    }
}