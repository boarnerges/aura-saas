"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import * as LucideIcons from "lucide-react";
import { FaTwitter, FaYoutube, FaGithub, FaLinkedin, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { useTheme } from "@/contexts/ThemeContext"; // Import useTheme
import { Sun, Moon, Palette } from "lucide-react"; // Import icons for theme toggle
import { Link as LinkType } from "@/types";
import { Loader2, Plus, Trash2, Globe, Type } from "lucide-react";
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

const DynamicIcon = ({ iconName, size, className }: { iconName: string, size: number, className: string }) => {
  // Check if it's a brand icon
  const BrandIconComponent = brandIcons[iconName];
  if (BrandIconComponent) {
    return <BrandIconComponent size={size} className={className} />;
  }

  // Otherwise, assume it's a Lucide icon
  const LucideIconComponent = LucideIcons[iconName as keyof typeof LucideIcons];
  if (!LucideIconComponent) {
    return <LucideIcons.Globe size={size} className={className} />; // Fallback to Globe if icon not found
  }
  return <LucideIconComponent size={size} className={className} />;
};

// 1. Define the Interface for TypeScript
interface UserProfile {
  clerk_id: string;
  username: string;
  display_name: string | null;
  initialBio: string;
  theme: string; // Added theme property
}

export default function DashboardPage() {
  const { user, isLoaded: isAuthLoaded } = useUser();
  const { theme, setTheme } = useTheme(); // Use the theme context
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null); // State for our profile box
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Function to update theme in Supabase
  const updateProfileTheme = useCallback(
    debounce(async (newTheme: string) => {
      if (!user) return;
      setErrorMsg(null);
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ theme: newTheme })
          .eq("clerk_id", user.id);
        if (error) {
          console.error("Theme Update Failed:", error.message);
          setErrorMsg(`Failed to save theme: ${error.message}`);
        }
      } catch (err: any) {
        console.error("CRITICAL ERROR updating theme:", err.message);
        setErrorMsg(err.message);
      }
    }, 500),
    [user],
  );

  // Handle theme change from toggle
  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : theme === "dark" ? "midnight" : "light";
    setTheme(newTheme, true); // Persist locally
    updateProfileTheme(newTheme); // Update in Supabase
  };

  // 2. INITIALIZE & SYNC
  useEffect(() => {
    async function initializeDashboard() {
      if (!isAuthLoaded || !user) return;
      setErrorMsg(null);

      try {
        // Fetch existing profile - renamed to 'profileData' to avoid conflict with State
        const { data: profileData, error: profileCheckError } = await supabase
          .from("profiles")
          .select("clerk_id, username, display_name, theme")
          .eq("clerk_id", user.id)
          .maybeSingle();

        if (profileCheckError)
          throw new Error(`Profile Check: ${profileCheckError.message}`);

        let currentProfile = profileData;

        // If no profile exists, create one with a fallback
        if (!profileData) {
          const usernameToUse = (
            user.username || `user_${user.id.slice(-6)}`
          ).toLowerCase();
          const newProfileData = {
            clerk_id: user.id,
            username: usernameToUse,
            display_name: user.firstName || "New User",
            theme: "light", // Default theme
          };

          const { error: insertError } = await supabase
            .from("profiles")
            .insert([newProfileData]);

          if (insertError)
            throw new Error(`Profile Create: ${insertError.message}`);

          currentProfile = newProfileData;
        }

        // IMPORTANT: Sync the profile to our React State
        setProfile(currentProfile);
        // Set the theme from the profile
        setTheme(currentProfile.theme as "light" | "dark" | "midnight", true);

        // Fetch Links
        const { data: linksData, error: linksError } = await supabase
          .from("links")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (linksError) throw new Error(`Fetch Links: ${linksError.message}`);

        setLinks(linksData || []);
      } catch (err: any) {
        console.error("CRITICAL ERROR:", err.message);
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }

    initializeDashboard();
  }, [isAuthLoaded, user, setTheme]);

  // 3. DEBOUNCED UPDATE
  const debouncedUpdate = useCallback(
    debounce(async (id: string, updates: Partial<LinkType>) => {
      setSaving(true);
      setErrorMsg(null);

      const { error } = await supabase
        .from("links")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Update Failed:", error.message);
        setErrorMsg(`Failed to save: ${error.message}`);
      }
      setSaving(false);
    }, 500),
    [],
  );

  const handleUpdate = (id: string, updates: Partial<LinkType>) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
    debouncedUpdate(id, updates);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (updatedProfile.theme) {
      document.documentElement.setAttribute("data-theme", updatedProfile.theme);
    }
  };

  // 4. ADD & DELETE
  const addLink = async () => {
    if (!user) return;
    const newLink = { user_id: user.id, title: "New Link", url: "https://" };

    const { data, error } = await supabase
      .from("links")
      .insert([newLink])
      .select();

    if (error) {
      setErrorMsg(`Add Failed: ${error.message}`);
    } else if (data) {
      setLinks([...links, data[0]]);
    }
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      setErrorMsg(`Delete Failed: ${error.message}`);
    } else {
      setLinks(links.filter((l) => l.id !== id));
    }
  };

  if (!isAuthLoaded || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <Loader2 className="animate-spin text-black" size={40} />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">
          Syncing Cloud
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <nav className="bg-white border-b-2 border-black p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="font-black italic text-xl">AURA / DASHBOARD</h1>
          <div className="flex items-center gap-4">
            {saving && (
              <span className="text-xs text-gray-400 animate-pulse">
                Saving...
              </span>
            )}
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Toggle Theme"
            >
              {theme === "light" && <Sun size={20} />}
              {theme === "dark" && <Moon size={20} />}
              {theme === "midnight" && <Palette size={20} />}
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6">
        {/* WELCOME BOX (RESTORED) */}
        <div className="bg-black text-white p-8 border-4 border-black mb-8 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black italic uppercase leading-none">
                Welcome, {profile?.display_name || "Guest"}!
              </h2>
              <p className="text-blue-400 font-bold text-xs mt-2 tracking-widest uppercase">
                Status: Online & Building ⚡
              </p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`text-[10px] font-black uppercase px-4 py-2 border-2 transition-all ${
                isSettingsOpen
                  ? "bg-red-500 text-white border-white"
                  : "bg-white text-black border-black hover:bg-blue-500 hover:text-white"
              }`}
            >
              {isSettingsOpen ? "Close Settings ×" : "Edit Profile ✎"}
            </button>
          </div>
        </div>

        {/* OPTIONAL PROFILE SETTINGS */}
        {isSettingsOpen && user && profile && (
          <div className="mb-10 transition-all">
            <ProfileSetting
              userId={user.id}
              initialUsername={profile.username}
              initialDisplayName={profile.display_name || ""}
              initialBio={profile.initialBio || ""}
              onUpdate={handleProfileUpdate}
            />
            <div className="h-px bg-gray-200 w-full mb-8" />
          </div>
        )}

        {/* ERROR MESSAGE DISPLAY */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-sm">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* LINK LIST TITLE */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
          <h3 className="font-black uppercase text-xs tracking-[0.2em] text-gray-500">
            Live Link Stack
          </h3>
        </div>
        {/* LINK LIST */}
        <div className="space-y-4">
          <h3 className="font-black uppercase text-xs tracking-widest text-gray-400 mb-2">
            My Links
          </h3>
          {links.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl">
              <p className="text-gray-400">No links yet. Start building!</p>
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="bg-white border-2 border-black p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <select
                      value={link.icon_name || "Globe"}
                      onChange={(e) =>
                        handleUpdate(link.id, { icon_name: e.target.value })
                      }
                      className="bg-gray-100 border-2 border-black p-1 text-xs font-black rounded uppercase outline-none focus:bg-blue-500 focus:text-white transition-all"
                    >
                      <option value="Globe">General</option>
                      <option value="Twitter">X / Twitter</option>
                      <option value="Github">GitHub</option>
                      <option value="Youtube">YouTube</option>
                      <option value="Linkedin">LinkedIn</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Tiktok">TikTok</option>
                      <option value="Briefcase">Portfolio</option>
                    </select>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) =>
                        handleUpdate(link.id, { title: e.target.value })
                      }
                      className="w-full font-bold text-lg outline-none focus:text-blue-600"
                      placeholder="Link Title"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <DynamicIcon iconName={link.icon_name || "Globe"} size={18} className="text-gray-400" />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) =>
                        handleUpdate(link.id, { url: e.target.value })
                      }
                      className="w-full text-sm text-gray-500 outline-none focus:text-blue-600"
                      placeholder="https://your-link.com"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} /> DELETE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={addLink}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95 transition-all z-20"
        >
          <Plus size={20} /> Add New Link
        </button>
      </main>
    </div>
  );
}
