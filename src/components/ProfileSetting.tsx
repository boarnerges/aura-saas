"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Settings, Save, AlertTriangle } from "lucide-react";
import { getToken } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import Cropper from "react-easy-crop";
import getCroppedImg, { blobToFile, getImgSrc } from "../lib/utils";

interface ProfileSettingsProps {
  userId: string;
  initialUsername: string;
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string | null; // Added
  onUpdate: (updatedProfile: any) => void;
}

export default function ProfileSettings({
  userId,
  initialUsername,
  initialDisplayName,
  initialBio = "",
  initialAvatarUrl, // Added
  onUpdate,
}: ProfileSettingsProps) {
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl); // Added
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Cropper states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleUpdate = async (updates: { avatar_url?: string }) => {
    // Modified to accept updates
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
          ...updates, // Apply additional updates like avatar_url
        })
        .eq("clerk_id", userId)
        .select();

      if (error) {
        alert("Update Error: " + error.message);
      } else if (data && data.length > 0) {
        onUpdate(data[0]);
        setAvatarUrl(data[0].avatar_url); // Update local avatar state
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

  const handleCropSave = useCallback(async () => {
    setLoading(true);
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedImageBlob = await getCroppedImg(
          imageToCrop,
          croppedAreaPixels,
        );

        if (!croppedImageBlob) {
          throw new Error("Failed to crop image.");
        }

        const fileExt = imageToCrop.split(";")[0].split("/")[1]; // Extract extension from data URL
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const croppedFile = blobToFile(croppedImageBlob, fileName);

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

        // 3. Upload to Supabase Storage using the authenticated client
        const { error: uploadError } = await supabaseAuth.storage
          .from("avatars")
          .upload(fileName, croppedFile);

        if (uploadError) throw uploadError;

        // 4. Get the Public URL using the authenticated client
        const {
          data: { publicUrl },
        } = supabaseAuth.storage.from("avatars").getPublicUrl(fileName);

        // 5. Update the Profile in the DB
        await handleUpdate({ avatar_url: publicUrl });

        setImageToCrop(null); // Close the cropper modal
        setZoom(1); // Reset zoom
        setCrop({ x: 0, y: 0 }); // Reset crop position
      }
    } catch (error: any) {
      alert("Error uploading cropped avatar: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [imageToCrop, croppedAreaPixels, userId, handleUpdate]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const imgSrc = await getImgSrc(file);
      setImageToCrop(imgSrc); // Set image to crop, opening the modal
    } catch (error: any) {
      alert("Error reading file: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-[var(--aura-card)] border-4 border-[var(--aura-border)] p-6 mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-6">
          <Settings size={20} className="text-[var(--aura-accent)]" />
          <h2 className="font-black italic uppercase text-lg tracking-tight text-(--aura-text)">
            Public Identity
          </h2>
        </div>

        <div className="space-y-6">
          {/* Username Field */}
          <div>
            <label className="block text-[10px] font-black uppercase mb-1 text-[var(--aura-text)]">
              Your Aura URL
            </label>
            <div className="flex items-center border-2 border-[var(--aura-border)] p-3 bg-[var(--aura-bg)] focus-within:border-[var(--aura-accent)] transition-colors">
              <span className="text-[var(--aura-text)] font-bold mr-1">
                aura.link/
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="bg-transparent outline-none font-bold w-full text-[var(--aura-text)]"
              />
            </div>
          </div>

          {/* Display Name Field */}
          <div>
            <label className="block text-[10px] font-black uppercase mb-1 text-[var(--aura-text)]">
              Display Name
            </label>
            <div className="border-2 border-[var(--aura-border)] p-3 focus-within:border-[var(--aura-accent)] transition-colors">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="outline-none font-bold w-full text-[var(--aura-text)]"
              />
            </div>
          </div>

          {/* Bio Input Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--aura-text)]">
              Professional Bio (Max 160)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[var(--aura-bg)] border-2 border-[var(--aura-border)] p-3 font-bold text-sm focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none resize-none text-[var(--aura-text)] placeholder-[var(--aura-text)]"
              placeholder="e.g. Software Developer | Building NairaFlow & Aura"
              rows={3}
            />
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--aura-text)]">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--aura-border)] flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--aura-text)] flex items-center justify-center text-xl font-black italic text-[var(--aura-bg)]">
                    {initialUsername.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={loading}
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer bg-[var(--aura-accent)] text-[var(--aura-bg)] px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
              >
                {loading ? "Uploading..." : "Upload New Avatar"}
              </label>
            </div>
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleUpdate({});
            }}
            disabled={loading}
            className="w-full bg-(--aura-text) text-(--aura-bg) py-4 font-black uppercase italic flex items-center justify-center gap-2 hover:bg-[var(--aura-accent)] transition-all disabled:opacity-50"
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
            <p className="text-[var(--aura-text)] text-xs uppercase tracking-widest mb-2">
              Live Preview Link
            </p>
            <a
              href={`/${username}`}
              target="_blank"
              className="text-[var(--aura-accent)] hover:text-[var(--aura-accent)] text-sm font-mono"
            >
              localhost:3000/{username}
            </a>
          </div>
        </div>
      </div>

      {imageToCrop && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-xl aspect-square bg-[#111] rounded-lg overflow-hidden">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1} // Keep it a perfect circle/square
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setImageToCrop(null)}
              className="px-6 py-2 text-white/50 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCropSave}
              className="bg-[var(--aura-accent)] text-black px-8 py-3 font-bold uppercase italic"
            >
              Confirm Crop
            </button>
          </div>
        </div>
      )}
    </>
  );
}
