"use client";
import {useUserStore} from "@/app/store/useUserStore";

export default function testPage() {
    const {user, clearUser, setUser, isLoadingUser} = useUserStore();

    return (
        <div>
            {user?.id}
            {user?.email}
            {user?.name}
        </div>
    )
}