# Aura 2026

> A high-performance, local-first Link-in-Bio SaaS built with Next.js 16.

## Tech Stack

- **Framework**: Next.js 16 (App Router + React Compiler)
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript (Strict)
- **Architecture**: Server Actions & Partial Prerendering (PPR)

## Project Goals

- [ ] Implement Multi-tenant routing via Next 16 Proxy.
- [ ] Integration of Local-first AI for content auditing.
- [ ] Achieving 100/100 Lighthouse performance scores.

## Architecture

This project follows the **Feature-Sliced Design (FSD)** pattern to ensure scalability.

## Deploying (Netlify)

Build settings:

- Build command: `npm run build`
- Publish directory: `.next`

Required environment variables:

- `NEXT_PUBLIC_SITE_URL` (for example: `https://your-domain.com`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (usually `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (usually `/sign-up`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (usually `/dashboard`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (usually `/dashboard`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
