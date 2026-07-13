import type { NextPage } from "next";
import { Header } from "../Header";
import Head from "next/head";
import Link from "next/link";

const apiEndpoint =
  "https://api.ensideas.com/ens/resolve/0xc9c022fcfebe730710ae93ca9247c5ec9d9236d0";
const apiResponse = {
  address: "0xC9C022FCFebE730710aE93CA9247c5Ec9d9236d0",
  name: "frolic.eth",
  displayName: "frolic.eth",
  avatar:
    "https://lh3.googleusercontent.com/xkHbgnjMo4vRUjWNPUDCt7zGfRr0kYEajyPV1z_EPRRK1maqrd5r_amLwYqUtQ109gbqNsjgNvLHZMfMkbzQMt3ioYrHxhNzo2TK",
};

const AboutPage: NextPage = () => (
  <>
    <Head>
      <title>About ENS Ideas</title>

      <meta name="og:title" content="About ENS Ideas" />
      <meta name="og:url" content="https://ensideas.com/about" />
      <meta
        name="og:description"
        content="Learn more about ENS Ideas and the APIs behind it"
      />
      <meta name="og:image" content="https://ensideas.com/twitter-card.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="@frolic" />
    </Head>
    <div className="w-screen min-h-screen flex flex-col bg-indigo-400 text-indigo-900 sm:pt-12 px-4 sm:px-12 pb-40 space-y-12">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-x-16 gap-y-12">
        <div className="col-span-2 space-y-4">
          <h1 className="text-4xl font-medium">About</h1>
          <p className="text-lg text-indigo-700">
            Hi, I&apos;m{" "}
            <a
              href="https://twitter.com/frolic"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-indigo-900 hover:underline"
            >
              frolic.eth
            </a>
            . I created ENS Ideas to explore blockchain data and subgraphs and
            to speed up brainstorming for .eth domain names. I am{" "}
            <a
              href="https://twitter.com/frolic/status/1473038104223047680"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-indigo-900 hover:underline"
            >
              tweeting
            </a>{" "}
            about the process and made{" "}
            <a
              href="https://github.com/holic/ens-ideas"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-indigo-900 hover:underline"
            >
              the code open source
            </a>
            . Let me know what you think!
          </p>
          <p className="text-lg text-indigo-700">
            Like emoji domains? Check{" "}
            <Link href="/emoji">
              <a className="font-bold text-indigo-900 hover:underline">
                which ones are still available
              </a>
            </Link>
            .
          </p>
        </div>
        <div className="col-span-3 bg-black bg-opacity-80 text-green-400 font-mono rounded-3xl p-12 space-y-6">
          <h2 className="text-4xl font-medium">ENS name &amp; avatar API</h2>
          <p>
            I often find that my dApps need a nice way to display a name and
            avatar for a given wallet address/account. The usual approach of
            resolving an ENS name and avatar via ethers.js is too slow and can
            overwhelm an Infura/Alchemy node.
          </p>
          <p>
            To help with this, I built a cached REST API endpoint that
            you&apos;re welcome to use in your dApp. Addresses are automatically
            normalized to lowercase (via a redirect) and results are cached for
            24 hours at Cloudflare&apos;s edge nodes, so responses are fast!
          </p>
          <div className="bg-black text-green-200 rounded-lg p-4 whitespace-pre overflow-auto">
            <code>
              GET{" "}
              <a href={apiEndpoint} target="_blank" rel="noreferrer">
                {apiEndpoint}
              </a>
              <br />
              <br />
              {JSON.stringify(apiResponse, null, 2)}
            </code>
          </div>
          <table className="border-2 border-black">
            <tbody>
              <tr>
                <td className="p-3 border-2 border-black text-green-200">
                  address
                </td>
                <td className="p-3 border-2 border-black">
                  Ethereum address, in checksum format
                </td>
              </tr>
              <tr>
                <td className="p-3 border-2 border-black text-green-200">
                  name
                </td>
                <td className="p-3 border-2 border-black">
                  ENS name, if reverse record is set to an active domain
                </td>
              </tr>
              <tr>
                <td className="p-3 border-2 border-black text-green-200">
                  displayName
                </td>
                <td className="p-3 border-2 border-black">
                  ENS name or, if none set, truncated address (e.g.
                  0xC9C&hellip;36d0)
                </td>
              </tr>
              <tr>
                <td className="p-3 border-2 border-black text-green-200">
                  avatar
                </td>
                <td className="p-3 border-2 border-black">
                  avatar image URL, if set
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
);

export default AboutPage;
