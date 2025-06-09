"use client";
import Link from "next/link";
import {useState} from "react";
import {Avatar} from "primereact/avatar";
import {Button} from "primereact/button";
import {IconField} from "primereact/iconfield";
import {InputIcon} from "primereact/inputicon";
import {InputText} from "primereact/inputtext";
import {Sidebar} from "primereact/sidebar";
import {Menu} from "primereact/menu";
import {MenuItem} from "primereact/menuitem";
import {useGlobalLoadingStore} from "@/app/store/useGlobalLoadingStore";
import {getAuthCode} from "@/api/auth";
import {useToast} from "@/components/provider/ToastProvider";

type UserType = {
    id: string;
    name: string;
    email: string;
    lastname: string;
    father_name: string;
};

export default function HeaderPublic() {
    const [user, setUser] = useState<UserType>();
    const [menuVisible, setMenuVisible] = useState(false);
    const {status, active, inactive} = useGlobalLoadingStore();
    const [authLoading, setAuthLoading] = useState<boolean>(false);
    const toast = useToast();

    let menu_items: MenuItem[] = [
        {label: 'Главная', icon: 'pi pi-home', url: "/"},
        {label: 'Тесты', icon: 'pi pi-check', url: '/test'},
        {label: 'Категории', icon: 'pi pi-list', url: '/category'},
        {label: 'О нас', icon: 'pi pi-users', url: '/about'},
        {label: 'Контакт', icon: 'pi pi-forward', url: '/contact'},
    ];


    async function sentAndGetAuthCode() {
        try {
            active();
            setAuthLoading(true);

            const res = await getAuthCode();

            if (res.success && res.url) {
                toast.showSuccess("Ийгиликтүү код алынды!"); // <--- Эми toast аныкталган болушу керек
                window.location.href = res.url;
            } else {
                console.error("Ошибка авторизации:", res.error || "Неизвестная ошибка");
                inactive();
                toast.showError(res.error || "Авторизацияда белгисиз ката кетти."); // Ката билдирүүсү
                // Можно добавить уведомление для пользователя
                // dispatch(updNotification({ error: "Ошибка авторизации", success: "" }));
            }
        } catch (err) {
            console.error("Непредвиденная ошибка в sentAndGetAuthCode:", err);
            inactive();
            toast.showError("Авторизация API'сине туташууда ката кетти."); // API чакыруу катасы

        } finally {
            setAuthLoading(false);
        }
        if (res.success && res.url) {
            window.location.href = res.url;
        } else {
            console.error("Ошибка авторизации:", res.error || "Неизвестная ошибка");
            toast.showError("Авторизация API'сине туташууда ката кетти."); // API чакыруу катасы
            inactive();
            // Можно добавить уведомление для пользователя
            // dispatch(updNotification({ error: "Ошибка авторизации", success: "" }));
        }
    }


    return (
        <header className="p-4 bg-base-100 text-base-100 border-b border-base-300">
            <div className={"flex justify-between items-center max-w-7xl mx-auto"}>
                <div className="text-lg font-bold">
                    <Link href="/src/components/public">
                        <Button link label="PrimeTest" icon="pi pi-check-circle" className="px-3 font-bold"/>
                    </Link>
                </div>

                <div className="hidden md:flex space-x-4">
                    {menu_items.map((item: MenuItem, index: number) => {
                        return (
                            <Link key={index} href={'' + item.url}
                                  className="decoration-gray-100 text-gray-700 hover:decoration-gray-800 animation-delay-200 transition-[0.8s]">
                                {item.label}
                            </Link>
                        )
                    })}
                </div>

                <div className="flex items-center space-x-4">
                    <div className="hidden md:block">
                        <IconField iconPosition="left">
                            <InputIcon className="pi pi-search"></InputIcon>
                            <InputText placeholder="Search" className=" rounded-md"/>
                        </IconField>
                    </div>
                    <div>
                        {user && user.id ? (
                            <Avatar label="U" style={{backgroundColor: '#9c27b0', color: '#ffffff'}} shape="circle"/>
                        ) : (
                            <Button onClick={sentAndGetAuthCode} label="Войти" icon="pi pi-user" loading={authLoading}/>
                        )}
                    </div>
                    <Button
                        icon="pi pi-bars"
                        className=" md:hidden"

                        onClick={() => setMenuVisible(true)}
                    />
                </div>

                <Sidebar visible={menuVisible} onHide={() => setMenuVisible(false)}
                         className="w-full md:hidden h-screen">
                    <Link href='/src/components/public'>
                        <Button link label="PrimeTest" icon="pi pi-check-circle" className="px-3 font-bold"/>
                    </Link>
                    <Menu model={menu_items} className="w-full border-none"/>
                </Sidebar>
            </div>
        </header>
    );
}
