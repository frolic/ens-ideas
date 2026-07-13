import names from '../emoji.json';
import { EmojiChecker } from '../components/emojiChecker';

export default async function EmojiPage() {
  return (
    <>
      <title>Available emoji .eth domains</title>
      <meta name="og:title" content="Available emoji .eth domains" />
      <meta name="og:url" content="https://ensideas.com/emoji" />
      <meta
        name="og:description"
        content={`Check which of the ${names.length.toLocaleString()} emoji .eth domains are still available to register. 👀`}
      />
      <meta name="og:image" content="https://ensideas.com/twitter-card.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="@frolic" />
      <EmojiChecker />
    </>
  );
}

export const getConfig = async () => {
  return {
    render: 'dynamic',
  } as const;
};
