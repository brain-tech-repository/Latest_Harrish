"use client"
import { getQueryClient } from "@/lib/get-query-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
const queryClient = getQueryClient();
export default function RootLayout({

    children,
}: Readonly<{

    children: React.ReactNode;
}>) {

    const [queryClient] = useState(() => new QueryClient());
    return (
        <html lang="en">
            <body>
                <QueryClientProvider client={queryClient}>
                    {children}
                    <ReactQueryDevtools initialIsOpen={false} />
                </QueryClientProvider>
            </body>
        </html>
    );
}