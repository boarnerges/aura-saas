"use client";

import { Link } from "@/types";
import LinkCard from "@/components/LinkCard";
import { useState, useEffect } from "react";

export default function Home() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("aura-links");
    if (saved) {
      setLinks(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      {links.map((link) => (
        <LinkCard key={link.id} link={link} />
      ))}
    </div>
  );
}
