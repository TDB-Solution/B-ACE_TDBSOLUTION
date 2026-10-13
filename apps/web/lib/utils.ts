import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(-2);
  return parts.map((part) => part[0] || '').join('').toUpperCase() || '?';
}

export function vnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + ' ₫';
}

export function compactMoney(value: number) {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2).replace('.', ',') + ' tỷ ₫';
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace('.', ',') + ' tr ₫';
  return vnd(value);
}

export function roleLabel(role: string) {
  if (role === 'admin') return 'Quản trị viên';
  if (role === 'manager') return 'Quản lý';
  return 'Sales';
}
