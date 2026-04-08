"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Settings, Save, AlertTriangle } from "lucide-react";
import { getToken } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";

interface ProfileSettingsProps {
  userId: string;
  initialUsername: string;
  initialDisplayName: string;
  initialBio: string;
  onUpdate: (updatedProfile: any) => void;
}

export default function ProfileSettings({
  userId,
  initialUsername,
  initialDisplayName,
  initialBio = "",
  onUpdate,
}: ProfileSettingsProps) {
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleUpdate = async () => {
    if (!getToken) return;
    setLoading(true);

    try {
      // 1. Get the Passport from Clerk
      const token = await getToken({ template: "supabase" });

      if (!token) {
        alert("Authentication failed. Please sign in again.");
        setLoading(false);
        return;
      }

      // 2. Create a one-time client that uses your Clerk Token
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        },
      );

      // 3. Use THIS client to update. Now auth.uid() won't be NULL.
      const { data, error } = await supabaseAuth
        .from("profiles")
        .update({
          username: username.toLowerCase().trim(),
          display_name: displayName,
          bio: bio.trim(),
        })
        .eq("clerk_id", userId)
        .select();

      if (error) {
        alert("Update Error: " + error.message);
      } else if (data && data.length > 0) {
        onUpdate(data[0]);
        alert("Identity Synced! Welcome, " + data[0].display_name);
      } else {
        console.warn(
          "Match failed. Check if clerk_id in DB is exactly:",
          userId,
        );
      }
    } catch (err) {
      console.error("System Error:", err);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white border-4 border-black p-6 mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={20} className="text-blue-600" />
        <h2 className="font-black italic uppercase text-lg tracking-tight">
          Public Identity
        </h2>
      </div>

      <div className="space-y-6">
        {/* Username Field */}
        <div>
          <label className="block text-[10px] font-black uppercase mb-1 text-gray-400">
            Your Aura URL
          </label>
          <div className="flex items-center border-2 border-black p-3 bg-gray-50 focus-within:border-blue-600 transition-colors">
            <span className="text-gray-400 font-bold mr-1">aura.link/</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="bg-transparent outline-none font-bold w-full"
            />
          </div>
        </div>

        {/* Display Name Field */}
        <div>
          <label className="block text-[10px] font-black uppercase mb-1 text-gray-400">
            Display Name
          </label>
          <div className="border-2 border-black p-3 focus-within:border-blue-600 transition-colors">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              className="outline-none font-bold w-full"
            />
          </div>
        </div>

        {/* Bio Input Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Professional Bio (Max 160)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-gray-50 border-2 border-black p-3 font-bold text-sm focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none resize-none"
            placeholder="e.g. Software Developer | Building NairaFlow & Aura"
            rows={3}
          />
        </div>

        {message && (
          <div
            className={`p-3 text-xs font-bold uppercase flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.type === "error" && <AlertTriangle size={14} />}
            {message.text}
          </div>
        )}

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full bg-black text-white py-4 font-black uppercase italic flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          {loading ? (
            "Syncing..."
          ) : (
            <>
              <Save size={18} /> Update Brand
            </>
          )}
        </button>
        <div className="mt-6 border-t pt-4">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">
            Live Preview Link
          </p>
          <a
            href={`/${username}`}
            target="_blank"
            className="text-blue-500 hover:text-blue-700 text-sm font-mono"
          >
            localhost:3000/{username}
          </a>
        </div>
      </div>
    </div>
  );
}
