// pages/_app.tsx
import React from "react";
import type { AppProps } from "next/app";
import { LogsProvider } from "../Components/LogsProvider";
import "../Style/globals.css"; // предполагаем Tailwind подключён

export default function App({ Component, pageProps }: AppProps) {
    return (
        <LogsProvider>
            <Component {...pageProps} />
        </LogsProvider>
    );
}
