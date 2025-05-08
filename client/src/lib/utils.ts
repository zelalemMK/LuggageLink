import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, formatStr: string = "PPP"): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, formatStr);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatDateForInput(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, "yyyy-MM-dd");
}

export function getRandomColor(name: string): string {
  // Generate a color based on the user's name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 80%)`;
}

export function formatWeight(weight: number): string {
  return `${weight} kg`;
}

export function formatPrice(price: number, isTotalPrice: boolean = false): string {
  return isTotalPrice ? `$${price}` : `$${price}/kg`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function formatAvailability(availableWeight: number): string {
  return `${availableWeight}kg available`;
}
