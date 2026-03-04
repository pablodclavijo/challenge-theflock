import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Constructs the full URL for product images stored in the Admin project
 * @param imageUrl - The relative image path (e.g., /uploads/products/filename.webp)
 * @returns The full URL to the image
 */
export function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
    return `${import.meta.env.VITE_ADMIN_BASE_URL}${imageUrl}`;
}
