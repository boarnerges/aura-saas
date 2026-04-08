"use client";

import { useParams, notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/contexts/ThemeContext"; // Import useTheme
import { Sun, Moon, Palette } from "lucide-react"; // Import icons for theme toggle
import { Link as LinkType } from "@/types";
import { Loader2, ExternalLink } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { FaTwitter, FaYoutube, FaGithub, FaLinkedin, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa"; // Import brand icons

const brandIcons: { [key: string]: React.ElementType } = {
  Twitter: FaTwitter,
  Youtube: FaYoutube,
  Github: FaGithub,
  Linkedin: FaLinkedin,
  Instagram: FaInstagram,
  Facebook: FaFacebook,
  Tiktok: FaTiktok,
};

const DynamicIcon = ({ name, size = 20 }: { name: string; size?: number }) => {
  // Check if it's a brand icon
  const BrandIconComponent = brandIcons[name];
  if (BrandIconComponent) {
    return <BrandIconComponent size={size} />;
  }

  // Otherwise, assume it's a Lucide icon
  const LucideIconComponent = LucideIcons[name as keyof typeof LucideIcons];
  if (!LucideIconComponent) {
    return <LucideIcons.Globe size={size} />; // Fallback to Globe if icon not found
  }
  return <LucideIconComponent size={size} />;
};

export default function UserProfile() {
  const params = useParams();
  const username = params.username as string;
  const { theme, setTheme } = useTheme(); // Use the theme context

  const [links, setLinks] = useState<LinkType[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPublicProfile() {
      setLoading(true);
      // STEP 1: Find the Clerk ID linked to this username in our 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clerk_id, display_name, bio, theme")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      // Handle the "User Not Found" state without crashing
      if (profileError || !profile) {
        console.log("No profile found for this username.");
        setLoading(false);
        return;
      }

      setDisplayName(profile.display_name || username);
      setProfile(profile);

      // Set the theme from the profile, but don't persist to local storage
      // The ThemeProvider will handle local storage persistence for user preference
      setTheme(profile.theme as "light" | "dark" | "midnight", false);


      // STEP 2: Fetch the links belonging to that Clerk ID
      const { data: linksData, error: linksError } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", profile.clerk_id)
        .order("created_at", { ascending: true });

      if (!linksError && linksData) {
        setLinks(linksData);
      }

      setLoading(false);
    }

    if (username) {
      loadPublicProfile();
    }
  }, [username, setTheme]); // Added setTheme to dependency array

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-black" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-20 min-h-screen bg-white font-sans text-black">
      {/* Theme Toggle Button */}
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "midnight" : "light", true)}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        title="Toggle Theme"
      >
        {theme === "light" && <Sun size={20} />}
        {theme === "dark" && <Moon size={20} />}
        {theme === "midnight" && <Palette size={20} />}
      </button>
      {/* Profile Header */}
      <div className="mb-12 text-center">
        <div className="w-24 h-24 bg-black rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-black italic border-4 border-white shadow-2xl">
          {username.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-black tracking-tighter uppercase italic">
          @{username}
        </h1>
        {/* Display the Bio */}
        {profile?.bio && (
          <p className="max-w-70 mx-auto mt-3 text-sm font-medium leading-relaxed text-gray-600">
            {profile.bio}
          </p>
        )}
        <p className="text-gray-400 text-sm font-bold tracking-widest mt-1">
          {displayName.toUpperCase()}&apos;S AURA
        </p>
      </div>

      {/* The Public Link Stack */}
      <div className="w-full max-w-md px-6 space-y-5">
        {links.length > 0 ? (
          links.map((link) => (
            <a
              key={link.id}
              href={
                link.url.startsWith("http") ? link.url : `https://${link.url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="group block w-full bg-white border-2 border-black p-5 rounded-2xl font-black text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.75 hover:translate-y-0.75 hover:shadow-none transition-all"
            >
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-4">
                  <DynamicIcon name={link.icon_name} />
                  <span className="text-lg uppercase tracking-tight italic">
                    {link.title}
                  </span>
                </div>
                <ExternalLink
                  size={18}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </a>
          ))
        ) : (
          <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-3xl">
            <p className="text-gray-400 font-medium">
              This aura is currently empty.
            </p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <footer className="mt-auto py-10">
        <p className="text-[10px] font-black tracking-[0.4em] opacity-10 uppercase">
          Powered by Aura
        </p>
      </footer>
    </div>
  );
}
