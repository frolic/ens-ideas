import { App } from '../App';

export default async function HomePage() {
  return (
    <>
      <title>ENS Ideas — Instant .eth domain search</title>
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
      <App />
    </>
  );
}

export const getConfig = async () => {
  return {
    render: 'dynamic',
  } as const;
};
