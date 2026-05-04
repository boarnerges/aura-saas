import { Metadata } from 'next';

type Props = {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
};

// This function dynamically generates the "Aura Card" metadata for X/Twitter
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  
  if (!username) {
    return {
      title: "Aura Profile",
      description: "Check out this Aura profile.",
    };
  }

  // We point to our new API route
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const ogImage = `${baseUrl}/api/og/${username}`;

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
