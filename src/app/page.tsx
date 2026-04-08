"use client";

import Link from "next/link";
import { useUser, SignOutButton } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();

  // Prevent a "flash" of the guest screen while Clerk loads
  if (!isLoaded) return null;

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-7xl font-black tracking-tighter italic mb-4">AURA</h1>
      <p className="text-xl text-gray-600 mb-10 max-w-lg font-medium">
        The simplest way to share your digital world.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {isSignedIn ? (
          <>
            {/* 1. Primary Action: Enter the App */}
            <Link
              href="/dashboard"
              className="bg-black text-white px-10 py-4 rounded-full font-bold hover:scale-105 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Go to Dashboard
            </Link>

            {/* 2. Secondary Action: Log Out */}
            <SignOutButton redirectUrl="/">
              <button className="border-2 border-black bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-red-50 hover:text-red-600 transition-all">
                Sign Out
              </button>
            </SignOutButton>
          </>
        ) : (
          <>
            <Link
              href="/sign-up"
              className="bg-black text-white px-10 py-4 rounded-full font-bold hover:scale-105 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Create Your Aura
            </Link>

            <Link
              href="/sign-in"
              className="border-2 border-black bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-gray-50 transition-all"
            >
              Sign In
            </Link>
          </>
        )}
      </div>

      {isSignedIn && (
        <div className="mt-12 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <img
            src={user.imageUrl}
            alt="profile"
            className="w-14 h-14 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          />
          <p className="text-sm text-gray-500 font-medium">
            Logged in as{" "}
            <span className="font-bold text-black uppercase tracking-tight">
              {user.firstName}
            </span>
          </p>
        </div>
      )}
    </main>
  );
}
