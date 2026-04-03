import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Define which routes are "Public" (accessible without login)
const isPublicRoute = createRouteMatcher([
  "/", // The Landing Page
  "/sign-in(.*)", // Clerk's Sign-in page
  "/sign-up(.*)", // Clerk's Sign-up page
  "/:username", // The Public Profile (Dynamic)
]);

export default clerkMiddleware(async (auth, request) => {
  // 2. If the route is NOT public, protect it
  if (!isPublicRoute(request)) {
    await auth.protect(); // <--- NOTE: No parentheses after auth, and added 'await'
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
