# Next.js 16 Agent Rules (Project: Aura)

## 1. Core Architecture

- **Framework**: Next.js 16.2+ (App Router).
- **Runtime**: Node.js (via Turbopack).
- **Rules of Next.js 16**:
  - Always prefer **Server Components** by default.
  - Use the `'use cache'` directive for granular caching of components/functions.
  - Use `connection()` for dynamic data fetching, not the old `force-dynamic`.
  - Use `proxy.ts` instead of `middleware.ts` for request interception.

## 2. Coding Standards

- **TypeScript**: Strict Mode is ON. Prefer `interface` over `type` for object shapes.
- **State**: Use the **React Compiler** optimizations. Avoid manual `useMemo`, `useCallback`, or `memo` unless explicitly requested.
- **Forms**: Use `next/form` and **Server Actions** for all data mutations. No `axios` or manual `useEffect` fetching.
- **Styling**: Tailwind CSS only. No inline styles.

## 3. Specialized APIs (2026 Standards)

- **Local-First**: Use `IndexedDB` (via Dexie) for client-side persistence.
- **Async APIs**: `cookies()`, `headers()`, and `params` are ASYNC. Always `await` them.
- **AI**: Use `Transformers.js` for local inference. Refer to `node_modules/next/dist/docs/` for the latest API specs.

## 4. Communication

- Explain the **"Why"** before writing the **"How"**.
- If a task involves a breaking change from Next.js 15, flag it immediately.
