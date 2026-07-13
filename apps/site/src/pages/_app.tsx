import "tailwindcss/tailwind.css";
import type { AppProps } from "next/app";
import Head from "next/head";

const MyApp = ({ Component, pageProps }: AppProps) => (
  <>
    <Head>
      <title>ENS Ideas — Instant .eth domain search</title>
    </Head>
    <Component {...pageProps} />
  </>
);

export default MyApp;
