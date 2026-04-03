"use client";
import LinkCard from "@/components/LinkCard";
import { Link } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserProfile() {
  
  const params = useParams();
  const username = params.username;

  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    const loadLinks = () => {
      const saved = localStorage.getItem(`aura-links-${username}`);
      if (saved) {
        setLinks(JSON.parse(saved));
      } else {
        setLinks([]);
      }
    };

    // 2. Initial load on mount
    loadLinks();

    // 3. The "Cross-Tab" Sync Logic
    const handleStorageChange = (e: StorageEvent) => {
      // Only update if the key that changed matches THIS user
      if (e.key === `aura-links-${username}`) {
        loadLinks();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // 4. Cleanup (Crucial for performance!)
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [username]);
  return (
    <div className="flex flex-col items-center pt-20 min-h-screen bg-gray-50">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
          {String(username).charAt(0).toUpperCase()}
        </div>
        <h1 className="text-xl font-bold text-black ">@{username}</h1>
      </div>

      <div className="w-full max-w-md px-4 space-y-4">
        {links.length > 0 ? (
          links
            .filter((link) => link.isActive)
            .map((link) => <LinkCard key={link.id} link={link} />)
        ) : (
          <p className="text-center text-gray-400 mt-10">
            This user hasn&apos;t added any links yet.
          </p>
        )}
      </div>
    </div>
  );
}
