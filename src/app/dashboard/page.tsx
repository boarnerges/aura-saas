"use client";

import { Link } from "@/types";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const MY_USERNAME = "boarnerges"; // Replace with dynamic username logic if needed

  const [links, setLinks] = useState<Link[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`aura-links-${MY_USERNAME}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    if (links.length > 0) {
      localStorage.setItem(`aura-links-${MY_USERNAME}`, JSON.stringify(links));
    }
  }, [links]);

  //1. logic to ADD a new link
  const addLink = () => {
    const newLink: Link = {
      id: Date.now().toString(),
      title: "New Link",
      url: "https://example.com",
      isActive: true,
    };

    setLinks((prevLinks) => [...prevLinks, newLink]);
  };

  // 2. Logic to UPDATE a link
  const updateLink = (id: string, key: keyof Link, value: string) => {
    setLinks((prevLinks) =>
      prevLinks.map((link) =>
        link.id === id ? { ...link, [key]: value } : link,
      ),
    );
  };

  // 3. Logic to DELETE a link
  const deleteLink = (id: string) => {
    setLinks((prevLinks) => prevLinks.filter((link) => link.id !== id));
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={addLink} className=" border-2 px-4 py-2 rounded-lg mb-8">
        + Add New Link
      </button>

      {/* 3. The "List View" you were wondering about goes here */}
      <div className="space-y-4">
        {links.map((link) => (
          <div
            key={link.id}
            className="p-4 border rounded-lg flex flex-col gap-2 shadow-sm"
          >
            <input
              type="text"
              value={link.title}
              placeholder="Link Title (e.g. My Portfolio)"
              className="border p-2 rounded"
              onChange={(e) => updateLink(link.id, "title", e.target.value)}
            />
            <input
              type="text"
              value={link.url}
              placeholder="URL (https://...)"
              className="border p-2 rounded "
              onChange={(e) => updateLink(link.id, "url", e.target.value)}
            />
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-xs text-gray-400 font-mono">{link.id}</span>
              <button
                onClick={() => deleteLink(link.id)}
                className="text-red-500 border hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
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
