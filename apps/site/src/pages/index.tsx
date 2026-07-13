import type { NextPage } from "next";
import { App } from "../App";
import { Provider as GraphProvider } from "urql";
import { graph } from "../urql";
import Head from "next/head";

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <meta
          key="title"
          name="og:title"
          content="ENS Ideas — Instant .eth domain search"
        />
        <meta name="og:url" content="https://ensideas.com/" />
        <meta
          name="og:description"
          content="Search for .eth domains and get inspired by a realtime feed of .eth domain registrations"
        />
        <meta name="og:image" content="https://ensideas.com/twitter-card.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@frolic" />
      </Head>
      <GraphProvider value={graph}>
        <App />
      </GraphProvider>
    </>
  );
};

export default HomePage;
