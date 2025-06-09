"use client";

import {useGlobalLoadingStore} from "@/app/store/useGlobalLoadingStore";

export default function GlobalLoading() {
    const {status} = useGlobalLoadingStore();
    if (!status) {
        return null;
    }
    return (
        <>
            <div className="fixed inset-0 z-[1001] flex justify-center items-center bg-gray-900/20    select-none">
                <i className="pi pi-spin pi-spinner text-5xl text-base-100"></i>
            </div>
        </>
    )
}