"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import * as LucideIcons from "lucide-react";
import {
  FaTwitter,
  FaYoutube,
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaTiktok,
} from "react-icons/fa";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import { Sun, Moon, Palette, Loader2, Plus, Trash2, Globe } from "lucide-react";
import { Link, Profile } from "@/types";
import debounce from "lodash/debounce";
import ProfileSetting from "@/components/ProfileSetting";

const brandIcons: { [key: string]: React.ElementType } = {
  Twitter: FaTwitter,
  Youtube: FaYoutube,
  Github: FaGithub,
  Linkedin: FaLinkedin,
  Instagram: FaInstagram,
  Facebook: FaFacebook,
  Tiktok: FaTiktok,
};

const DynamicIcon = ({
  iconName,
  size,
  className,
}: {
  iconName: string;
  size: number;
  className: string;
}) => {
  const BrandIconComponent = brandIcons[iconName];
  if (BrandIconComponent) {
    return <BrandIconComponent size={size} className={className} />;
  }
  const LucideIconComponent = LucideIcons[iconName as keyof typeof LucideIcons];
  if (!LucideIconComponent) {
    return <Globe size={size} className={className} />;
  }
  return <LucideIconComponent size={size} className={className} />;
};

export default function DashboardPage() {
  const { user, isLoaded: isAuthLoaded } = useUser();
  const { theme, setTheme } = useTheme();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const updateProfileTheme = useCallback(
    debounce(async (newTheme: string) => {
      if (!user) return;
      try {
        await supabase
          .from("profiles")
          .update({ theme: newTheme })
          .eq("clerk_id", user.id);
      } catch (err: any) {
        console.error("Theme Update Failed:", err.message);
      }
    }, 500),
    [user],
  );

  const handleThemeToggle = () => {
    const newTheme =
      theme === "light" ? "dark" : theme === "dark" ? "midnight" : "light";
    setTheme(newTheme, true);
    if (profile) setProfile({ ...profile, theme: newTheme });
    updateProfileTheme(newTheme);
  };

  useEffect(() => {
    async function initializeDashboard() {
      if (!isAuthLoaded || !user) return;
      try {
        const { data: profileData, error: profileCheckError } = await supabase
          .from("profiles")
          .select("clerk_id, username, display_name, theme, avatar_url, bio")
          .eq("clerk_id", user.id)
          .maybeSingle();

        if (profileCheckError) throw new Error(profileCheckError.message);

        let currentProfile: Profile | null = profileData;

        if (!profileData) {
          const usernameToUse = (
            user.username || `user_${user.id.slice(-6)}`
          ).toLowerCase();
          const newProfileData: Profile = {
            clerk_id: user.id,
            username: usernameToUse,
            display_name: user.firstName || "New User",
            theme: "light",
            avatar_url: null,
            bio: "",
          };
          await supabase.from("profiles").insert([newProfileData]);
          currentProfile = newProfileData;
        }

        setProfile(currentProfile);

        const sessionPref = localStorage.getItem("theme");
        if (!sessionPref && currentProfile) {
          setTheme(currentProfile.theme as Theme, true);
        }

        const { data: linksData } = await supabase
          .from("links")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        setLinks(linksData || []);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    initializeDashboard();
  }, [isAuthLoaded, user, setTheme]);

  const debouncedUpdate = useCallback(
    debounce(async (id: string, updates: Partial<Link>) => {
      setSaving(true);
      await supabase.from("links").update(updates).eq("id", id);
      setSaving(false);
    }, 500),
    [],
  );

  const handleUpdate = (id: string, updates: Partial<Link>) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
    debouncedUpdate(id, updates);
  };

  const addLink = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("links")
      .insert([{ user_id: user.id, title: "New Link", url: "https://" }])
      .select();
    if (data) setLinks([...links, data[0] as Link]);
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (!error) setLinks(links.filter((l) => l.id !== id));
  };

  if (!isAuthLoaded || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <Loader2 className="animate-spin text-black" size={40} />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">
          Syncing Aura
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--aura-bg)] pb-32">
      <nav className="bg-[var(--aura-card)] border-b-2 border-[var(--aura-border)] p-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="font-black italic text-lg md:text-xl text-[var(--aura-text)] tracking-tighter">
            AURA <span className="hidden sm:inline">/ DASHBOARD</span>
          </h1>
          <div className="flex items-center gap-2 md:gap-4">
            {saving && (
              <span className="text-[10px] text-blue-500 font-bold animate-pulse">
                SAVING...
              </span>
            )}
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-xl bg-[var(--aura-bg)] border-2 border-[var(--aura-border)] hover:scale-105 transition-all"
            >
              {theme === "light" && <Sun size={18} />}
              {theme === "dark" && <Moon size={18} />}
              {theme === "midnight" && <Palette size={18} />}
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-[var(--aura-card)] text-[var(--aura-text)] p-6 md:p-8 border-4 border-[var(--aura-border)] mb-8 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] md:shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] transition-all">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-4xl font-black italic uppercase leading-none tracking-tight">
                Hey, <br className="md:hidden" />{" "}
                {profile?.display_name || "Soj"}!
              </h2>
              <p className="text-[var(--aura-accent)] font-bold text-[10px] md:text-xs tracking-widest uppercase opacity-80">
                Aura Status: Online & Building ⚡
              </p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-full md:w-auto text-[10px] font-black uppercase px-6 py-3 border-2 transition-all active:scale-95 ${
                isSettingsOpen
                  ? "bg-red-500 text-white border-red-700"
                  : "bg-[var(--aura-text)] text-[var(--aura-bg)] border-[var(--aura-text)]"
              }`}
            >
              {isSettingsOpen ? "Close ×" : "Edit Profile ✎"}
            </button>
          </div>
        </div>

        {isSettingsOpen && user && profile && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
            <ProfileSetting
              userId={user.id}
              initialUsername={profile.username}
              initialDisplayName={profile.display_name || ""}
              initialBio={profile.bio || ""}
              initialAvatarUrl={profile.avatar_url}
              onUpdate={(upd) => setProfile(upd as Profile)}
            />
            <div className="h-0.5 bg-[var(--aura-border)] w-full my-8 opacity-20" />
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
          <h3 className="font-black uppercase text-[10px] md:text-xs tracking-[0.3em] text-[var(--aura-text)]">
            Live Link Stack
          </h3>
        </div>

        <div className="space-y-4">
          {links.length === 0 ? (
            <div className="text-center py-16 border-4 border-dashed border-[var(--aura-border)] rounded-3xl opacity-40">
              <p className="font-bold uppercase tracking-widest text-sm">
                Empty Stack
              </p>
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="bg-[var(--aura-card)] border-2 border-[var(--aura-border)] p-4 md:p-6 rounded-2xl shadow-[4px_4px_0px_0px_var(--aura-border)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={link.icon_name || "Globe"}
                      onChange={(e) =>
                        handleUpdate(link.id, { icon_name: e.target.value })
                      }
                      className="bg-[var(--aura-bg)] border-2 border-[var(--aura-border)] p-2 text-[10px] font-black rounded-lg uppercase outline-none focus:ring-2 ring-blue-500 transition-all text-[var(--aura-text)]"
                    >
                      <option value="Globe">General</option>
                      <option value="Twitter">Twitter/X</option>
                      <option value="Github">GitHub</option>
                      <option value="Youtube">YouTube</option>
                      <option value="Linkedin">LinkedIn</option>
                    </select>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) =>
                        handleUpdate(link.id, { title: e.target.value })
                      }
                      className="w-full font-black text-base md:text-xl outline-none bg-transparent focus:text-blue-500 transition-colors text-[var(--aura-text)]"
                      placeholder="Title"
                    />
                  </div>
                  <div className="flex items-center gap-3 px-1">
                    <DynamicIcon
                      iconName={link.icon_name || "Globe"}
                      size={16}
                      className="text-blue-500"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) =>
                        handleUpdate(link.id, { url: e.target.value })
                      }
                      className="w-full text-xs md:text-sm font-medium opacity-70 outline-none bg-transparent focus:opacity-100 text-[var(--aura-text)]"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-[var(--aura-border)] border-dashed flex justify-end">
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="flex items-center gap-2 text-[10px] font-black text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Trash2 size={12} /> REMOVE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center pointer-events-none z-40">
          <button
            onClick={addLink}
            className="pointer-events-auto w-full max-w-md bg-[var(--aura-text)] text-[var(--aura-bg)] py-5 rounded-2xl font-black uppercase italic flex justify-center items-center gap-3 shadow-[0_10px_20px_rgba(0,0,0,0.2),8px_8px_0px_0px_var(--aura-accent)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={22} strokeWidth={3} /> Add New Link
          </button>
        </div>
      </main>
    </div>
  );
}
