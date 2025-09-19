import "../../styles/globals.css";
import type { AppProps } from "next/app";
import { Header } from "../components/header/header";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Header/>
      <ToastContainer/>
      <Component {...pageProps}/>
    </SessionProvider>
  )
}
