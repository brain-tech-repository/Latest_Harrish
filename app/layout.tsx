import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers/react-query";

import { SnackbarProvider } from "./services/snackbarContext";
import { CountryFlagPolyfill } from "./emojis";
import { ThemeProvider } from "./contexts/themeContext";
import ThemePaletteModal from "./components/ThemePaletteModal";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hariss International",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <CountryFlagPolyfill />
          {/* <ThemePaletteModal /> */}
          {/* <LoadingProvider> */}
          <SnackbarProvider>
            <Toaster/>
        <Providers>{children}</Providers> 
          </SnackbarProvider>
          {/* </LoadingProvider> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
