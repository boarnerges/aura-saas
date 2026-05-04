"use client";

import { useState, useEffect } from "react";
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
import {
  Sun,
  Moon,
  Palette,
  Loader2,
  Plus,
  Trash2,
  Globe,
  TrendingUp,
  Link2,
  Activity,
  CircleCheckBig,
} from "lucide-react";
import { Link, Profile } from "@/types";
import ProfileSetting from "@/components/ProfileSetting";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@clerk/nextjs";

const brandIcons: { [key: string]: React.ElementType } = {
  Twitter: FaTwitter,
  Youtube: FaYoutube,
  Github: FaGithub,
  Linkedin: FaLinkedin,
  Instagram: FaInstagram,
  Facebook: FaFacebook,
  Tiktok: FaTiktok,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

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
  const LucideIconComponent = LucideIcons[
    iconName as keyof typeof LucideIcons
  ] as React.ElementType | undefined;
  if (!LucideIconComponent) {
    return <Globe size={size} className={className} />;
  }
  return <LucideIconComponent size={size} className={className} />;
};

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { user, isLoaded: isAuthLoaded } = useUser();
  const { theme, setTheme } = useTheme();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const liveLinksCount = links.filter((l) => l.url && l.url !== "https://").length;
  const topPlatforms = links
    .map((l) => l.icon_name || "Globe")
    .reduce<Record<string, number>>((acc, icon) => {
      acc[icon] = (acc[icon] || 0) + 1;
      return acc;
    }, {});
  const dominantPlatform = Object.entries(topPlatforms).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";

  const updateProfileTheme = async (newTheme: string) => {
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ theme: newTheme })
        .eq("clerk_id", user.id);
    } catch (err: unknown) {
      console.error("Theme Update Failed:", getErrorMessage(err));
    }
  };

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
      } catch (err: unknown) {
        setErrorMsg(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    initializeDashboard();
  }, [isAuthLoaded, user, setTheme]);

  useEffect(() => {
    if (!isSettingsOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isSettingsOpen]);

  const updateLink = async (id: string, updates: Partial<Link>) => {
    setSaving(true);
    await supabase.from("links").update(updates).eq("id", id);
    setSaving(false);
  };

  const handleUpdate = (id: string, updates: Partial<Link>) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
    updateLink(id, updates);
  };

  const addLink = async () => {
    if (!user) return;

    try {
      // 1. Get the Supabase JWT from Clerk
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Authentication failed");

      // 2. Use your authenticated client helper
      const authenticatedSupabase = getSupabaseClient(token);

      // 3. Perform the insert with the signed client
      const { data, error } = await authenticatedSupabase
        .from("links")
        .insert([
          {
            user_id: user.id, // This is your Clerk ID (TEXT)
            title: "New Link",
            url: "https://",
          },
        ])
        .select();

      if (error) {
        console.error("Supabase Error:", error);
        return;
      }

      // 4. Update the local state with the new link from the DB
      if (data && data.length > 0) {
        setLinks([...links, data[0] as Link]);
      }
    } catch (err) {
      console.error("Failed to add link:", err);
    }
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (!error) setLinks(links.filter((l) => l.id !== id));
  };

  if (!isAuthLoaded || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white text-black">
        <Loader2 className="animate-spin" size={40} />
        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">
          Syncing Aura
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--aura-bg)] pb-32">
      {/* HEADER */}
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
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-7">
        {errorMsg && (
          <div className="mb-6 border-2 border-red-500 bg-red-500/10 p-4 text-sm font-bold text-red-500">
            {errorMsg}
          </div>
        )}

        {/* WELCOME BOX */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--aura-card)] text-[var(--aura-text)] p-6 md:p-7 border-2 border-[var(--aura-border)] shadow-[4px_4px_0px_0px_var(--aura-accent)] rounded-2xl"
        >
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black italic uppercase leading-[0.95] tracking-tight">
                Hey, <br className="md:hidden" />{" "}
                {profile?.display_name || "Soj"}!
              </h2>
              <p className="text-[var(--aura-accent)] font-bold text-[10px] md:text-[11px] tracking-[0.2em] uppercase opacity-80">
                Aura Status: Online & Building ⚡
              </p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-full md:w-auto text-[10px] font-black uppercase tracking-[0.18em] px-5 py-2.5 border-2 rounded-xl transition-all active:scale-95 ${
                isSettingsOpen
                  ? "bg-red-500 text-white border-red-700"
                  : "bg-[var(--aura-text)] text-[var(--aura-bg)] border-[var(--aura-text)]"
              }`}
            >
              {isSettingsOpen ? "Close ×" : "Edit Profile ✎"}
            </button>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="rounded-2xl border-2 border-[var(--aura-border)] bg-[var(--aura-card)] p-4 shadow-[3px_3px_0px_0px_var(--aura-border)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60">
                Active Links
              </p>
              <Link2 size={14} className="opacity-60" />
            </div>
            <p className="text-[2rem] font-black leading-none">{liveLinksCount}</p>
            <p className="text-xs mt-2 opacity-60">Links ready on your public profile</p>
          </div>
          <div className="rounded-2xl border-2 border-[var(--aura-border)] bg-[var(--aura-card)] p-4 shadow-[3px_3px_0px_0px_var(--aura-border)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60">
                Dominant Platform
              </p>
              <TrendingUp size={14} className="opacity-60" />
            </div>
            <p className="text-2xl font-black leading-none">{dominantPlatform}</p>
            <p className="text-xs mt-2 opacity-60">Most-used icon in your stack</p>
          </div>
          <div className="rounded-2xl border-2 border-[var(--aura-border)] bg-[var(--aura-card)] p-4 shadow-[3px_3px_0px_0px_var(--aura-border)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60">
                Profile Status
              </p>
              <CircleCheckBig size={14} className="opacity-60" />
            </div>
            <p className="text-2xl font-black leading-none">
              {profile?.bio ? "Optimized" : "Needs Bio"}
            </p>
            <p className="text-xs mt-2 opacity-60">Add a bio to improve credibility</p>
          </div>
        </motion.section>

        {/* SETTINGS DRAWER */}
        <AnimatePresence>
          {isSettingsOpen && user && profile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md px-4 py-6 md:px-6"
            >
              <button
                type="button"
                aria-label="Close settings"
                onClick={() => setIsSettingsOpen(false)}
                className="absolute inset-0 cursor-default"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 26 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 26 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="relative z-10 mx-auto flex h-[calc(100vh-3rem)] w-full max-w-2xl"
              >
                <div className="w-full overflow-hidden rounded-3xl border-2 border-[var(--aura-border)] bg-[var(--aura-card)] shadow-[10px_10px_0px_0px_var(--aura-accent)]">
                  <div className="flex items-center justify-between border-b-2 border-[var(--aura-border)] px-5 py-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">
                        Edit Profile
                      </p>
                      <h3 className="text-lg font-black italic uppercase tracking-tight text-[var(--aura-text)]">
                        Public Identity
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[var(--aura-border)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                        <CircleCheckBig size={12} />
                        Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSettingsOpen(false)}
                        className="rounded-xl border-2 border-[var(--aura-border)] bg-[var(--aura-bg)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-transform active:scale-95"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="h-full overflow-y-auto p-5 md:p-6">
                    <ProfileSetting
                      userId={user.id}
                      initialUsername={profile.username}
                      initialDisplayName={profile.display_name || ""}
                      initialBio={profile.bio || ""}
                      initialAvatarUrl={profile.avatar_url}
                      onUpdate={(upd) => setProfile(upd as Profile)}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
          <h3 className="font-black uppercase text-[10px] md:text-[11px] tracking-[0.24em] text-[var(--aura-text)]">
            Live Link Stack
          </h3>
        </div>

        {/* LINK LIST */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {links.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 border-4 border-dashed border-[var(--aura-border)] rounded-3xl opacity-40"
              >
                <p className="font-bold uppercase tracking-widest text-sm">
                  Empty Stack
                </p>
              </motion.div>
            ) : (
              links.map((link) => (
                <motion.div
                  key={link.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: 0.2 },
                  }}
                  whileHover={{ y: -2 }}
                  className="bg-[var(--aura-card)] border-2 border-[var(--aura-border)] p-4 md:p-5 rounded-2xl shadow-[3px_3px_0px_0px_var(--aura-border)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <select
                        value={link.icon_name || "Globe"}
                        onChange={(e) =>
                          handleUpdate(link.id, { icon_name: e.target.value })
                        }
                        className="bg-(--aura-bg) border-2 border-(--aura-border) p-2 text-[10px] font-black rounded-lg uppercase text-(--aura-text) outline-none focus:ring-2 ring-blue-500"
                      >
                        <option value="Globe">General</option>
                        <option value="Twitter">Twitter/X</option>
                        <option value="Github">GitHub</option>
                        <option value="Youtube">YouTube</option>
                        <option value="Linkedin">LinkedIn</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Twitch">Twitch</option>
                        <option value="ExternalLink">Portfolio</option>
                      </select>
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) =>
                          handleUpdate(link.id, { title: e.target.value })
                        }
                        className="w-full font-black text-base md:text-lg outline-none bg-transparent text-[var(--aura-text)] focus:text-blue-500 transition-colors"
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
                        className="w-full text-xs md:text-sm font-medium opacity-70 outline-none bg-transparent text-[var(--aura-text)] focus:opacity-100"
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
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border-2 border-[var(--aura-border)] bg-[var(--aura-card)] p-5 shadow-[3px_3px_0px_0px_var(--aura-border)]"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-[var(--aura-accent)]" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
              Recent Activity
            </h4>
          </div>
          <ul className="space-y-3">
            <li className="text-sm opacity-80">Updated dashboard theme to <span className="font-bold">{theme}</span>.</li>
            <li className="text-sm opacity-80">Managing <span className="font-bold">{links.length}</span> total links.</li>
            <li className="text-sm opacity-80">Latest profile slug: <span className="font-bold">@{profile?.username || "pending"}</span>.</li>
          </ul>
        </motion.section>

        {/* FLOATING ACTION BUTTON */}
        <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center pointer-events-none z-40">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addLink}
            className="pointer-events-auto w-full max-w-sm bg-[var(--aura-text)] text-[var(--aura-bg)] py-3.5 rounded-xl font-black uppercase italic text-sm flex justify-center items-center gap-2 shadow-[0_10px_20px_rgba(0,0,0,0.2),6px_6px_0px_0px_var(--aura-accent)]"
          >
            <Plus size={18} strokeWidth={3} /> Add New Link
          </motion.button>
        </div>
      </main>
    </div>
  );
}
