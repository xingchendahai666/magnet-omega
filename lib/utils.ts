import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function parseSize(sizeStr: string): number {
  const match = sizeStr.match(/(\d+\.?\d*)\s*(B|KB|MB|GB|TB)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 ** 2,
    'GB': 1024 ** 3,
    'TB': 1024 ** 4,
  };
  return Math.floor(value * (multipliers[unit] || 1));
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (weeks < 4) return `${weeks}周前`;
  if (months < 12) return `${months}月前`;
  return `${years}年前`;
}

export function formatRelativeDate(timestamp: number): string {
  return formatDate(timestamp);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateInfoHash(title: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha1').update(title).digest('hex');
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function getCategoryName(catId: string): string {
  const categories: Record<string, string> = {
    '100': 'Audio',
    '101': 'Music',
    '102': 'Audio books',
    '103': 'Sound clips',
    '104': 'FLAC',
    '199': 'Other',
    '200': 'Video',
    '201': 'Movies',
    '202': 'Movies DVDR',
    '203': 'Music videos',
    '204': 'Movie clips',
    '205': 'TV shows',
    '206': 'Handheld',
    '207': 'HD - Movies',
    '208': 'HD - TV shows',
    '209': '3D',
    '299': 'Other',
    '300': 'Applications',
    '301': 'Windows',
    '302': 'Mac',
    '303': 'UNIX',
    '304': 'Handheld',
    '305': 'IOS (iPad/iPhone)',
    '306': 'Android',
    '399': 'Other OS',
    '400': 'Games',
    '401': 'PC',
    '402': 'Mac',
    '403': 'PSx',
    '404': 'XBOX360',
    '405': 'Wii',
    '406': 'Handheld',
    '407': 'IOS (iPad/iPhone)',
    '408': 'Android',
    '499': 'Other',
    '500': 'Porn',
    '501': 'Movies',
    '502': 'Movies DVDR',
    '503': 'Pictures',
    '504': 'Games',
    '505': 'HD - Movies',
    '506': 'Movie clips',
    '599': 'Other',
    '600': 'Other',
    '601': 'E-books',
    '602': 'Comics',
    '603': 'Pictures',
    '604': 'Covers',
    '605': 'Physibles',
    '699': 'Other',
  };
  return categories[catId] || 'Other';
  }
