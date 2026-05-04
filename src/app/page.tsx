"use client";

import Image from "next/image";
import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  BarChart3,
  Check,
  Globe2,
  Palette,
  Share2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const stats = [
  { value: "01", label: "link that feels premium" },
  { value: "3x", label: "faster profile setup" },
  { value: "24/7", label: "always-on digital front door" },
];

const features = [
  {
    icon: Globe2,
    title: "One sharp home",
    copy: "Put every link, launch, social, offer, and update behind a page that looks deliberate from the first tap.",
  },
  {
    icon: Palette,
    title: "A style that sticks",
    copy: "Shape your profile around your brand with themes that feel bold, polished, and instantly recognizable.",
  },
  {
    icon: BarChart3,
    title: "Signals that matter",
    copy: "See what people click, what gets attention, and where to point your audience next.",
  },
];

const previewLinks = [
  "Book a strategy call",
  "Watch the latest drop",
  "Shop the creator kit",
];

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f4ea] text-zinc-950">
      <section className="relative isolate min-h-screen px-5 py-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,#fb7185_0,transparent_28%),radial-gradient(circle_at_80%_15%,#22d3ee_0,transparent_24%),linear-gradient(135deg,#fff7ed_0%,#fef3c7_32%,#dcfce7_66%,#e0f2fe_100%)]" />
        <Image
          src="/blue-dot.png"
          alt=""
          width={420}
          height={420}
          priority
          unoptimized
          className="absolute -right-20 top-20 -z-10 h-56 w-56 opacity-60 mix-blend-multiply sm:h-80 sm:w-80 lg:h-[26rem] lg:w-[26rem]"
        />
        <Image
          src="/black-dot.png"
          alt=""
          width={260}
          height={260}
          priority
          unoptimized
          className="absolute -bottom-20 left-6 -z-10 h-44 w-44 opacity-20 sm:h-64 sm:w-64"
        />

        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border-2 border-zinc-950 bg-white/75 px-4 py-3 shadow-[6px_6px_0_#18181b] backdrop-blur">
          <Link href="/" className="flex items-center gap-2 font-black uppercase">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-950 text-white">
              A
            </span>
            Aura
          </Link>

          <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide text-zinc-700 md:flex">
            <span>Profiles</span>
            <span>Analytics</span>
            <span>Themes</span>
          </div>

          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-black uppercase text-white transition hover:-translate-y-0.5 hover:bg-rose-600"
            >
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-full border-2 border-zinc-950 bg-white px-5 py-3 text-sm font-black uppercase transition hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              Sign in
            </Link>
          )}
        </nav>

        <div className="mx-auto grid max-w-7xl items-center gap-12 pb-16 pt-16 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[1.02fr_0.98fr] lg:pt-10">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-lime-300 px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0_#18181b]">
              <Sparkles className="h-4 w-4" />
              Your link-in-bio, with presence
            </div>

            <h1 className="max-w-4xl text-6xl font-black leading-[0.9] tracking-normal text-zinc-950 sm:text-7xl lg:text-8xl xl:text-9xl">
              Make your digital aura impossible to ignore.
            </h1>

            <p className="mt-7 max-w-2xl text-xl font-semibold leading-8 text-zinc-700 sm:text-2xl">
              Aura turns scattered links into a punchy personal hub for creators,
              founders, freelancers, and anyone building momentum online.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-3 rounded-full border-2 border-zinc-950 bg-rose-500 px-7 py-4 text-base font-black uppercase text-white shadow-[6px_6px_0_#18181b] transition hover:-translate-y-1 hover:shadow-[9px_9px_0_#18181b]"
                  >
                    Open dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <SignOutButton redirectUrl="/">
                    <button className="inline-flex items-center justify-center rounded-full border-2 border-zinc-950 bg-white px-7 py-4 text-base font-black uppercase shadow-[6px_6px_0_#18181b] transition hover:-translate-y-1 hover:bg-amber-200 hover:shadow-[9px_9px_0_#18181b]">
                      Sign out
                    </button>
                  </SignOutButton>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center gap-3 rounded-full border-2 border-zinc-950 bg-rose-500 px-7 py-4 text-base font-black uppercase text-white shadow-[6px_6px_0_#18181b] transition hover:-translate-y-1 hover:shadow-[9px_9px_0_#18181b]"
                  >
                    Claim your aura
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center rounded-full border-2 border-zinc-950 bg-white px-7 py-4 text-base font-black uppercase shadow-[6px_6px_0_#18181b] transition hover:-translate-y-1 hover:bg-cyan-200 hover:shadow-[9px_9px_0_#18181b]"
                  >
                    I already have one
                  </Link>
                </>
              )}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="border-l-4 border-zinc-950 bg-white/65 py-3 pl-4 backdrop-blur"
                >
                  <p className="text-3xl font-black">{item.value}</p>
                  <p className="mt-1 text-sm font-bold uppercase text-zinc-600">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-5 top-10 hidden rotate-[-8deg] rounded-full border-2 border-zinc-950 bg-cyan-300 px-5 py-3 text-sm font-black uppercase shadow-[5px_5px_0_#18181b] sm:block">
              Live profile
            </div>
            <div className="absolute -right-3 bottom-24 hidden rotate-[7deg] rounded-full border-2 border-zinc-950 bg-amber-300 px-5 py-3 text-sm font-black uppercase shadow-[5px_5px_0_#18181b] sm:block">
              Share anywhere
            </div>

            <div className="rotate-[-2deg] rounded-[2rem] border-[3px] border-zinc-950 bg-zinc-950 p-4 shadow-[18px_18px_0_#18181b]">
              <div className="rounded-[1.5rem] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-500 text-2xl font-black text-white">
                      A
                    </div>
                    <div>
                      <p className="text-lg font-black">@youraura</p>
                      <p className="text-sm font-bold text-zinc-500">
                        Creator hub
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase">
                    Live
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border-2 border-zinc-950 bg-[linear-gradient(135deg,#fb7185,#facc15_48%,#22d3ee)] p-5 text-white shadow-[6px_6px_0_#18181b]">
                  <p className="text-sm font-black uppercase">Featured now</p>
                  <h2 className="mt-12 text-4xl font-black leading-none">
                    Turn every tap into your next move.
                  </h2>
                </div>

                <div className="mt-5 space-y-3">
                  {previewLinks.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl border-2 border-zinc-950 bg-white p-4 font-black shadow-[4px_4px_0_#18181b]"
                    >
                      <span>{item}</span>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-950 text-sm text-white">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-zinc-950 p-4 text-white">
                    <Share2 className="h-5 w-5" />
                    <p className="mt-6 text-2xl font-black">8.2k</p>
                    <p className="text-xs font-bold uppercase text-zinc-400">
                      Shares
                    </p>
                  </div>
                  <div className="rounded-2xl bg-cyan-200 p-4">
                    <Zap className="h-5 w-5" />
                    <p className="mt-6 text-2xl font-black">64%</p>
                    <p className="text-xs font-bold uppercase text-zinc-600">
                      Clicks
                    </p>
                  </div>
                  <div className="rounded-2xl bg-lime-300 p-4">
                    <ShieldCheck className="h-5 w-5" />
                    <p className="mt-6 text-2xl font-black">Pro</p>
                    <p className="text-xs font-bold uppercase text-zinc-600">
                      Brand
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {isSignedIn && (
              <div className="mx-auto mt-10 flex w-fit items-center gap-3 rounded-full border-2 border-zinc-950 bg-white px-4 py-3 shadow-[5px_5px_0_#18181b]">
                <Image
                  src={user.imageUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full border-2 border-zinc-950 object-cover"
                />
                <p className="text-sm font-black uppercase">
                  Logged in as {user.firstName ?? "creator"}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y-[3px] border-zinc-950 bg-zinc-950 px-5 py-4 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-black uppercase sm:text-base">
          <span>Launch pages</span>
          <span className="text-lime-300">Creator bios</span>
          <span>Offer links</span>
          <span className="text-cyan-300">Social proof</span>
          <span>Analytics</span>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase text-rose-600">
              Built to stop the scroll
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Everything your audience needs, shaped into one loud, clear
              destination.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-3xl border-2 border-zinc-950 bg-[#f7f4ea] p-6 shadow-[8px_8px_0_#18181b] transition hover:-translate-y-1 hover:shadow-[12px_12px_0_#18181b]"
                >
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-zinc-950 bg-white">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-8 text-2xl font-black">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-base font-semibold leading-7 text-zinc-700">
                    {feature.copy}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-[2rem] border-2 border-zinc-950 bg-lime-300 p-6 shadow-[10px_10px_0_#18181b] sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-black uppercase">Ready when you are</p>
              <h2 className="mt-2 text-3xl font-black">
                Build a profile people remember.
              </h2>
            </div>
            <Link
              href={isSignedIn ? "/dashboard" : "/sign-up"}
              className="inline-flex items-center gap-3 rounded-full border-2 border-zinc-950 bg-zinc-950 px-6 py-4 text-base font-black uppercase text-white transition hover:-translate-y-0.5 hover:bg-rose-600"
            >
              {isSignedIn ? "Go to dashboard" : "Start free"}
              <Check className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
