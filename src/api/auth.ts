import { api } from "@/lib/api";
import { AuthCodeType } from "@/type/AuthCodeType";

export async function getAuthCode(): Promise<{ success: boolean; url?: string; error?: any }> {
    try {
        const res = await api.get("/v1/authorization");
        const data: AuthCodeType = res.data;

        return {
            success: data.success,
            url: (process.env.NEXT_PUBLIC_AUTH_SERVICE || "") + data.auth_code,
        };
    } catch (error) {
        console.error("Ошибка при получении кода авторизации:", error);
        return {
            success: false,
            error,
        };
    }
}

export async function authenticate(code: string | null): Promise<{
    success: boolean;
    access_token?: string;
    refresh_token?: string;
    expires_at?: string;
    error?: any;
}> {
    try {
        const res = await api.get("/v1/authorization/end", {
            params: {code}
        });
        const data = res.data;

        return {
            success: data.success,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
        };
    } catch (error) {
        console.error("Ошибка при получении кода авторизации:", error);
        return {
            success: false,
            error,
        };
    }
}
