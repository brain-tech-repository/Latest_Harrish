"use client";

import { useEffect, useState } from "react";
import LoginPage from "./(public)/login/page";
import { isVerify } from "./services/allApi";
import { useRouter, usePathname } from "next/navigation";

import Loading from "./components/Loading";
import { useSnackbar } from "./services/snackbarContext";
import ThemeSwitcherBar from "./components/ThemeSwitcherBar";
import { secureAuth } from "./utils/secureStorage";

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);
    const { showSnackbar } = useSnackbar();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        async function verifyUser() {
            const res = await isVerify();
            if (res.error) {
                showSnackbar(res.data.message, "error");
                setIsLoading(false);
            }
            if (res.code === 200) {
                // Use secure storage for sensitive data
                secureAuth.setRole(res?.data?.role?.id);
                secureAuth.setUserId(res?.data?.id);
                secureAuth.setCountry(res?.data?.companies[0]?.selling_currency);

                // Only redirect to /profile if user is on the root path
                // If they're on another page (like /route or /vehicle), stay there
                if (pathname === "/" || !pathname) {
                    router.push("/profile");
                }
            }
        }
        if (localStorage.getItem("token")) verifyUser();
        else setIsLoading(false);
    }, [pathname, router, showSnackbar]);

    return (
        <div className="min-h-screen w-full bg-primary/10 dark:bg-primary/20 transition-colors">
            {isLoading ? <Loading /> : <LoginPage />}
        </div>
    );
}
