import { ThreeLetters } from '../components/threeLetters';

const count = (26 * 26 * 26).toLocaleString();

export default async function ThreeLettersPage() {
  return (
    <>
      <title>Available three-letter .eth domains</title>
      <meta name="og:title" content="Available three-letter .eth domains" />
      <meta name="og:url" content="https://ensideas.com/three-letters" />
      <meta
        name="og:description"
        content={`Check which of the ${count} three-letter .eth domains are still available to register. 👀`}
      />
      <meta name="og:image" content="https://ensideas.com/twitter-card.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="@frolic" />
      <ThreeLetters />
    </>
  );
}

export const getConfig = async () => {
  return {
    render: 'dynamic',
  } as const;
};
