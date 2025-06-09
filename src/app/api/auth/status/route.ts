// src/app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import {api} from "@/lib/api"; // Backend'ге сурам жөнөтүү үчүн

export async function GET(request: Request) {
    // Сервер тараптан `cookies()` функциясы аркылуу HttpOnly кукилерди окуй алабыз

    // Башталгыч жооп объектин түзүп алабыз. Бул объектке кукилерди кошуу керек.
    // Эгерде акыркы натыйжада isAuthenticated: true болсо, анда жаңы жооп түзүлөт.
    let response = NextResponse.json({ isAuthenticated: false, user: null }, { status: 200 });


    try {
        // Backend'ге колдонуучунун профилин алуу үчүн биринчи аракет
        const userProfileRes = await api.get(`/v1/user`);

        const user = userProfileRes.data;

        if (user) {
            // Эгер колдонуучунун маалыматы ийгиликтүү алынса
            return NextResponse.json({ isAuthenticated: true, user: user }, { status: 200 });
        } else {
            // Backend'ден колдонуучу алынбаса (мисалы, бош жооп)
            // Бул учурда да аутентификацияланбаган деп эсептейбиз
            return response;
        }

    } catch (error) {
        // Биринчи аракетте ката кетти
        console.error("API /auth/status: Access token менен профилди алууда ката:", error.message);


        // Бардык каталарда (же токен жаңыртуу ишке ашпаса) колдонуучу аутентификацияланбаган деп кайтаруу
        // Бул учурда баштапкы response объектиси колдонулат (isAuthenticated: false, user: null)
        return response;
    }
}