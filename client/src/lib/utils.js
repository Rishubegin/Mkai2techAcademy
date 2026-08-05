import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:7777/api").replace(
  "/api",
  "",
);

// Gallery/event images and avatars are moving from local-disk relative
// paths ("/uploads/...", needing the API origin prefixed) to full Cloudinary
// URLs (already absolute). Blindly prefixing apiOrigin onto an absolute URL
// produces a broken "http://localhost:7777/apihttps://res.cloudinary..."
// string, so branch on whether the path is already a full URL.
export function resolveMediaUrl(path) {
  if (!path) return path;
  return /^https?:\/\//.test(path) ? path : `${apiOrigin}${path}`;
}

// Shared across the homepage carousel and the full courses listing so any
// course without an image yet (new admin-added ones, mainly) still renders
// a real photo instead of a broken/blank image slot.
export const COURSE_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop";
