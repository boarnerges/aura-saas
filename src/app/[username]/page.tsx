"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import {
  Sun,
  Moon,
  Palette,
  Loader2,
  ExternalLink,
  Globe,
  Share2,
} from "lucide-react";
import { Link, Profile } from "@/types";
import * as LucideIcons from "lucide-react";
import {
  FaTwitter,
  FaYoutube,
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaFacebook,
} from "react-icons/fa";

const brandIcons: { [key: string]: React.ElementType } = {
  Twitter: FaTwitter,
  Youtube: FaYoutube,
  Github: FaGithub,
  Linkedin: FaLinkedin,
  Instagram: FaInstagram,
  Facebook: FaFacebook,
  Globe: Globe,
  ExternalLink: ExternalLink,
};

const DynamicIcon = ({ name, size = 20 }: { name: string; size?: number }) => {
  const BrandIconComponent = brandIcons[name];
  if (BrandIconComponent) return <BrandIconComponent size={size} />;

  const LucideIconComponent = LucideIcons[name as keyof typeof LucideIcons];
  if (!LucideIconComponent) return <Globe size={size} />;

  // @ts-ignore
  return <LucideIconComponent size={size} />;
};

export default function UserProfile() {
  const params = useParams();
  const username = params.username as string;
  const { theme, setTheme } = useTheme();

  const [links, setLinks] = useState<Link[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false); // New state for 404 check

  useEffect(() => {
    async function loadPublicProfile() {
      setLoading(true);
      setNotFound(false);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("clerk_id, display_name, bio, theme, avatar_url, username")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      // If no profile is found in Supabase
      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Sync theme settings
      const localPref = localStorage.getItem("theme");
      if (!localPref) {
        setTheme(profileData.theme as Theme, false);
      }

      const { data: linksData } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", profileData.clerk_id)
        .order("created_at", { ascending: true });

      if (linksData) setLinks(linksData);
      setLoading(false);
    }

    if (username) loadPublicProfile();
  }, [username, setTheme]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${profile?.display_name}'s Aura`,
        text: `Check out my link stack on Aura!`,
        url: window.location.href,
      });
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--aura-bg)]">
        <Loader2 className="animate-spin text-[var(--aura-text)]" size={40} />
        <p className="mt-4 text-[10px] font-black tracking-[0.3em] text-[var(--aura-text)] opacity-40 uppercase">
          Syncing Aura
        </p>
      </div>
    );
  }

  // 🔥 THE "SUPER TIGHT" GUARD: Show this if James doesn't exist in the DB
  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--aura-bg)] text-[var(--aura-text)] p-6 text-center">
        <div className="w-24 h-24 mb-6 border-4 border-dashed border-[var(--aura-border)] rounded-full flex items-center justify-center opacity-20">
          <Globe size={40} />
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
          Aura Not Found
        </h1>
        <p className="text-sm font-bold opacity-60 max-w-xs mb-8">
          The handle <span className="text-blue-500">@{username}</span> hasn't
          been claimed yet or doesn't exist.
        </p>
        <a
          href="/"
          className="px-8 py-4 bg-[var(--aura-card)] border-2 border-[var(--aura-border)] shadow-[6px_6px_0px_0px_var(--aura-border)] font-black uppercase italic text-xs hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          Create Your Aura
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[var(--aura-bg)] text-[var(--aura-text)] selection:bg-blue-500 selection:text-white">
      {/* Action Bar */}
      <div className="w-full max-w-2xl flex justify-end p-6 gap-2">
        <button
          onClick={() =>
            setTheme(
              theme === "light"
                ? "dark"
                : theme === "dark"
                  ? "midnight"
                  : "light",
              true,
            )
          }
          className="p-3 rounded-2xl bg-[var(--aura-card)] border-2 border-[var(--aura-border)] shadow-[4px_4px_0px_0px_var(--aura-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          {theme === "light" && <Sun size={20} />}
          {theme === "dark" && <Moon size={20} />}
          {theme === "midnight" && <Palette size={20} />}
        </button>
        <button
          onClick={handleShare}
          className="p-3 rounded-2xl bg-[var(--aura-card)] border-2 border-[var(--aura-border)] shadow-[4px_4px_0px_0px_var(--aura-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          <Share2 size={20} />
        </button>
      </div>

      <main className="w-full max-w-[480px] px-6 pb-20">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="relative mb-6">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-[6px] border-[var(--aura-card)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-2 ring-[var(--aura-border)] bg-[var(--aura-card)]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[var(--aura-text)] flex items-center justify-center text-5xl font-black italic text-[var(--aura-bg)]">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-blue-500 border-4 border-[var(--aura-bg)] rounded-full animate-pulse" />
          </div>

          <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
            {profile?.display_name || username}
          </h1>
          <p className="mt-2 text-[10px] font-bold tracking-[0.2em] uppercase text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
            @{username}
          </p>

          {profile?.bio && (
            <p className="mt-5 text-sm md:text-base font-medium leading-relaxed opacity-80 max-w-[320px]">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-4">
          {links.length > 0 ? (
            links.map((link) => (
              <a
                key={link.id}
                href={
                  link.url.startsWith("http") ? link.url : `https://${link.url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block w-full bg-[var(--aura-card)] border-2 border-[var(--aura-border)] p-5 rounded-2xl shadow-[6px_6px_0px_0px_var(--aura-border)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[var(--aura-bg)] rounded-lg group-hover:scale-110 transition-transform">
                      <DynamicIcon name={link.icon_name} size={22} />
                    </div>
                    <span className="text-lg font-black uppercase italic tracking-tight">
                      {link.title}
                    </span>
                  </div>
                  <ExternalLink
                    size={18}
                    className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
                  />
                </div>
              </a>
            ))
          ) : (
            <div className="text-center p-12 border-4 border-dashed border-[var(--aura-border)] rounded-[2rem] opacity-30">
              <p className="font-black uppercase italic tracking-widest text-xs">
                Aura Empty
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto py-12 flex flex-col items-center gap-2">
        <div className="h-px w-12 bg-[var(--aura-border)] mb-4" />
        <p className="text-[10px] font-black tracking-[0.5em] opacity-20 uppercase">
          Project Aura
        </p>
      </footer>
    </div>
  );
}
