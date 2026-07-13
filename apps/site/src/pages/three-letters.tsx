import type { NextPage } from "next";
import { Header } from "../Header";
import Head from "next/head";
import { useBulkAvailability } from "../useBulkAvailability";
import { NameStatusCard } from "../NameStatusCard";
import { useState } from "react";

const letters = "abcdefghijklmnopqrstuvwxyz".split("");

const names: string[] = [];
// This is ugly but recursive functions still break my brain
for (let a = 0; a < letters.length; a++) {
  for (let b = 0; b < letters.length; b++) {
    for (let c = 0; c < letters.length; c++) {
      names.push(`${letters[a]}${letters[b]}${letters[c]}`);
    }
  }
}

const ThreeLetters: NextPage = () => {
  const [limit, setLimit] = useState(1000);
  const { value, loading } = useBulkAvailability(names);
  return (
    <>
      <Head>
        <title>Available three-letter .eth domains</title>

        <meta name="og:title" content="Available three-letter .eth domains" />
        <meta name="og:url" content="https://ensideas.com/three-letters" />
        <meta
          name="og:description"
          content={`Check which of the ${names.length.toLocaleString()} three-letter .eth domains are still available to register. 👀`}
        />
        <meta name="og:image" content="https://ensideas.com/twitter-card.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@frolic" />
      </Head>
      <div className="w-screen min-h-screen flex flex-col bg-indigo-400 text-indigo-900 sm:pt-12 px-4 sm:px-12 pb-40 space-y-12">
        <Header />
        <div>
          <h1 className="text-4xl font-medium leading-tight">
            Available three-letter .eth domains
          </h1>
          <p className="text-lg text-indigo-700">
            There are {names.length.toLocaleString()} possible three-letter ENS
            names.{" "}
            {value ? (
              <>
                <span className="pb-1 border-b-4 border-green-400 border-opacity-50">
                  {(names.length - value.length).toLocaleString()} of them are
                  available!
                </span>{" "}
                👀
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono">
          {names.slice(0, limit).map((name) => (
            <NameStatusCard
              key={name}
              size="small"
              name={name}
              isPending={loading || !value}
              isRegistered={value ? value.includes(name) : false}
            />
          ))}
        </div>
        <div className="flex items-center justify-center">
          <button
            type="button"
            className="text-xl px-4 py-2 rounded-xl border-2 border-indigo-500 hover:bg-indigo-500 hover:text-white"
            onClick={() => setLimit(limit + 1000)}
          >
            Show more
          </button>
        </div>
      </div>
    </>
  );
};

export default ThreeLetters;
