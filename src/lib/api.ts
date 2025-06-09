// lib/api.ts
import axios from 'axios';
// import {cookies} from "next/headers";
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL_LOCAL;

export const api = axios.create({
    baseURL: BACKEND_BASE_URL, // например, https://api.example.com
    headers: {
        'Content-Type': 'application/json',
    },
    // withCredentials: true,
});

// // Добавляем интерсептор запроса
// api.interceptors.request.use(
//     async (config) => {
//         // Пример: получаем токен из localStorage или cookie
//         const cookieStore = await cookies();
//         const access_token = cookieStore.has('access_token');
//         if (access_token) {
//             config.headers.Authorization = `Bearer ${access_token}`;
//         }
//
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );
// src/lib/api.ts же src/utils/axiosInstance.ts


// export { api };