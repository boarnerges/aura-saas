"use client";

import { Link } from "@/types";
import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  // 1. Get Clerk Identity
  const { user, isLoaded: isAuthLoaded } = useUser();

  // 2. Local State
  const [links, setLinks] = useState<Link[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 3. Determine the storage key dynamically
  // If the user hasn't set a 'username', we use their unique 'id'
  const storageKey = user ? `aura-links-${user.username || user.id}` : null;

  // Initial Load Logic
  useEffect(() => {
    if (isAuthLoaded && storageKey && !isDataLoaded) {
      const saved = localStorage.getItem(storageKey);
      let initialLinks: Link[] = [];
      if (saved) {
        initialLinks = JSON.parse(saved);
      }
      setTimeout(() => {
        setLinks(initialLinks); // Set links once
        setIsDataLoaded(true);
      }, 0);
    }
  }, [isAuthLoaded, storageKey, isDataLoaded]);

  // Save Logic
  useEffect(() => {
    if (isDataLoaded && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(links));
    }
  }, [links, isDataLoaded, storageKey]);

  // Helper Functions (Add, Update, Delete)
  const addLink = () => {
    const newLink: Link = {
      id: Date.now().toString(),
      title: "",
      url: "",
      isActive: true,
    };
    setLinks((prev) => [...prev, newLink]);
  };

  const updateLink = (id: string, key: keyof Link, value: string | boolean) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, [key]: value } : link)),
    );
  };

  const deleteLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  // Guard: Wait for Auth and Data to be ready
  if (!isAuthLoaded || !isDataLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading Aura...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-black">Aura Dashboard</h1>
          <p className="text-sm text-gray-500">
            Editing as @{user?.username || "user"}
          </p>
        </div>
        <UserButton />
      </header>

      <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center gap-3">
        {user?.imageUrl && (
          <Image
            src={user.imageUrl}
            className="w-10 h-10 rounded-full"
            alt="profile"
            width={40}
            height={40}
          />
        )}
        <p>
          Welcome back,{" "}
          <span className="font-bold">{user?.firstName || "Friend"}</span>!
        </p>
      </div>

      <button
        onClick={addLink}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg mb-8 hover:border-black transition-colors font-medium"
      >
        + Add New Link
      </button>

      <div className="space-y-4">
        {links.map((link) => (
          <div
            key={link.id}
            className="p-4 border-2 border-black rounded-lg flex flex-col gap-3 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <input
              type="text"
              value={link.title}
              placeholder="Link Title (e.g. My Portfolio)"
              className="font-bold text-lg focus:outline-none"
              onChange={(e) => updateLink(link.id, "title", e.target.value)}
            />
            <input
              type="text"
              value={link.url}
              placeholder="https://your-link.com"
              className="text-gray-500 focus:outline-none text-sm"
              onChange={(e) => updateLink(link.id, "url", e.target.value)}
            />

            <div className="flex justify-between items-center border-t pt-3 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={link.isActive}
                  onChange={(e) =>
                    updateLink(link.id, "isActive", e.target.checked)
                  }
                  className="accent-black"
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Visible
                </span>
              </label>
              <button
                onClick={() => deleteLink(link.id)}
                className="text-red-500 text-xs font-bold uppercase hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
