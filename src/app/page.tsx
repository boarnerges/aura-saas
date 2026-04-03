"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, user } = useUser();

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-7xl font-black tracking-tighter italic mb-4">AURA</h1>
      <p className="text-xl text-gray-600 mb-10 max-w-lg">
        The simplest way to share your digital world.
      </p>

      <div className="flex gap-4">
        {isSignedIn ? (
          <Link
            href="/dashboard"
            className="bg-black text-white px-10 py-4 rounded-full font-bold hover:scale-105 transition-all"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/sign-up"
            className="bg-black text-white px-10 py-4 rounded-full font-bold hover:scale-105 transition-all"
          >
            Create Your Account
          </Link>
        )}
      </div>

      {isSignedIn && (
        <p className="mt-4 text-sm text-gray-400">
          Logged in as{" "}
          <span className="font-bold underline">
            {user.username || user.firstName}
          </span>
        </p>
      )}
    </main>
  );
}
