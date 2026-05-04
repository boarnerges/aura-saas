"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { Settings, Save, AlertTriangle } from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import getCroppedImg from "../lib/utils";
import { Profile } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { getSupabaseClient } from "@/lib/supabase";

interface ProfileSettingsProps {
  userId: string;
  initialUsername: string;
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string | null;
  onUpdate: (updatedProfile: Profile) => void;
}

interface ProfileUpdates extends Partial<Profile> {
  avatarFile?: File | Blob;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export default function ProfileSettings({
  userId,
  initialUsername,
  initialDisplayName,
  initialBio = "",
  initialAvatarUrl,
  onUpdate,
}: ProfileSettingsProps) {
  const { getToken } = useAuth(); // Get the token getter from Clerk

  // --- STATE ---
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- CROPPER STATE ---
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // --- HANDLERS ---
  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImageToCrop(reader.result as string),
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropSave = async () => {
    setLoading(true);
    try {
      if (!imageToCrop || !croppedAreaPixels) {
        throw new Error("Choose and crop an image before saving.");
      }

      // 1. Get the cropped image blob
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedImage) throw new Error("Could not crop the selected image.");

      // 2. Get the fresh Supabase JWT from Clerk
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Authentication failed");

      // 3. Use the authenticated client helper
      const authenticatedSupabase = getSupabaseClient(token);

      // 4. Prepare file path (Folder-based for better RLS control)
      const fileExt = "jpg";
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`; // Saves in a folder named after the user

      // 5. Upload using the AUTHENTICATED client
      const { error: uploadError } = await authenticatedSupabase.storage
        .from("avatars")
        .upload(filePath, croppedImage, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 6. Get the Public URL
      const {
        data: { publicUrl },
      } = authenticatedSupabase.storage.from("avatars").getPublicUrl(filePath);

      // 7. Update state
      setAvatarUrl(publicUrl);
      setImageToCrop(null);
      setMessage({
        type: "success",
        text: "Avatar ready! Click 'Update Brand' to save.",
      });
    } catch (err: unknown) {
      console.error("Upload Error Details:", err);
      setMessage({
        type: "error",
        text: getErrorMessage(err) || "Cropping/Upload failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates: ProfileUpdates) => {
    setLoading(true);
    setMessage(null);

    try {
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Not authenticated");

      const authenticatedSupabase = getSupabaseClient(token);

      let currentAvatarUrl = avatarUrl;

      // --- NEW: STORAGE UPLOAD LOGIC ---
      // Check if the 'updates' object contains a file from the cropper
      if (updates.avatarFile) {
        const file = updates.avatarFile;
        const fileExt = file.type.split("/")[1] || "png";
        const filePath = `${userId}/avatar.${fileExt}`;

        // Upload the blob to the 'avatars' bucket
        const { error: uploadError } = await authenticatedSupabase.storage
          .from("avatars")
          .upload(filePath, file, {
            upsert: true, // Overwrite if it exists
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        // Get the final Public URL
        const { data: publicUrlData } = authenticatedSupabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        currentAvatarUrl = publicUrlData.publicUrl;

        // Remove the file from updates so it doesn't get sent to the DB table
        delete updates.avatarFile;
      }
      // --------------------------------

      // 3. Perform the update/upsert
      const { data, error } = await authenticatedSupabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            clerk_id: userId,
            username: username.toLowerCase().trim(),
            display_name: displayName.trim(),
            bio: bio.trim(),
            avatar_url: currentAvatarUrl, // Use the new URL if uploaded, else the old one
            ...updates,
          },
          { onConflict: "clerk_id" },
        )
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        onUpdate(data[0] as Profile);
        setMessage({
          type: "success",
          text: "Brand identity updated successfully! ⚡",
        });
      } else {
        throw new Error("Profile update returned no data.");
      }
    } catch (err: unknown) {
      console.error("Update Error:", err);
      setMessage({
        type: "error",
        text: getErrorMessage(err) || "Failed to update profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6 text-[var(--aura-text)]">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-[var(--aura-accent)]" />
          <h2 className="font-black italic uppercase text-lg tracking-tight">
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
            <div className="border-2 border-[var(--aura-border)] p-3 bg-[var(--aura-bg)] focus-within:border-[var(--aura-accent)] transition-colors">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="bg-transparent outline-none font-bold w-full text-[var(--aura-text)]"
              />
            </div>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--aura-text)]">
              Professional Bio (Max 160)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[var(--aura-bg)] border-2 border-[var(--aura-border)] p-3 font-bold text-sm focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none resize-none text-[var(--aura-text)]"
              placeholder="e.g. Software Developer | Building NairaFlow & Aura"
              rows={3}
              maxLength={160}
            />
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--aura-text)]">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--aura-border)] flex-shrink-0 bg-[var(--aura-bg)]">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-black italic text-[var(--aura-text)]">
                    {username.charAt(0).toUpperCase()}
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
                className="cursor-pointer bg-[var(--aura-text)] text-[var(--aura-bg)] px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
              >
                {loading ? "Uploading..." : "Upload New Avatar"}
              </label>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 text-xs font-bold uppercase flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {message.type === "error" && <AlertTriangle size={14} />}
              {message.text}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleUpdate({})}
            disabled={loading}
            className="w-full bg-[var(--aura-text)] text-[var(--aura-bg)] py-4 font-black uppercase italic flex items-center justify-center gap-2 hover:bg-[var(--aura-accent)] transition-all disabled:opacity-50"
          >
            {loading ? (
              "Syncing..."
            ) : (
              <>
                <Save size={18} /> Update Brand
              </>
            )}
          </button>
        </div>
      </div>

      {/* CROPPER MODAL */}
      <AnimatePresence>
        {imageToCrop && (
          <motion.div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-xl aspect-square bg-[#111] border-2 border-white/10 rounded-lg overflow-hidden">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setImageToCrop(null)}
                className="px-6 py-2 text-white/50 hover:text-white font-bold uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                className="bg-blue-600 text-white px-8 py-3 font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
              >
                Confirm Crop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
