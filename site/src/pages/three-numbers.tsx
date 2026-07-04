import { ThreeNumbers } from '../components/threeNumbers';

const count = (1000).toLocaleString();

export default async function ThreeNumbersPage() {
  return (
    <>
      <title>Available three-number .eth domains</title>
      <meta name="og:title" content="Available three-number .eth domains" />
      <meta name="og:url" content="https://ensideas.com/three-numbers" />
      <meta
        name="og:description"
        content={`Check which of the ${count} three-number .eth domains are still available to register. 👀`}
      />
      <meta name="og:image" content="https://ensideas.com/twitter-card.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="@frolic" />
      <ThreeNumbers />
    </>
  );
}

export const getConfig = async () => {
  return {
    render: 'dynamic',
  } as const;
};
