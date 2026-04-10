import { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { username: string }
};

// This function dynamically generates the "Aura Card" metadata for X/Twitter
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username;
  
  if (!username) {
    return {
      title: "Aura Profile",
      description: "Check out this Aura profile.",
    };
  }

  // We point to our new API route
  const ogImage = `${
    process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"
  }/api/og/${username}`;

  return {
    title: `${username} | Aura`,
    description: `Check out ${username}'s Aura profile.`,
    openGraph: {
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${username} | Aura`,
      description: `View my professional link stack on Aura.`,
      images: [ogImage],
    },
  };
}

export default function UserProfileLayout({ children }: Props) {
  return <>{children}</>;
}
