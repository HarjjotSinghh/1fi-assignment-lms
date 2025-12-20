import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function generateApplicationNumber(): string {
  return `APP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export function generateLoanNumber(): string {
  return `LOAN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export function calculateEMI(principal: number, rate: number, tenure: number): number {
  const monthlyRate = rate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
  return Math.round(emi);
}

export function calculateLTV(loanAmount: number, collateralValue: number): number {
  if (collateralValue === 0) return 0;
  return (loanAmount / collateralValue) * 100;
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PENDING: "bg-warning/10 text-warning border border-warning/20",
    SUBMITTED: "bg-info/10 text-info border border-info/20",
    UNDER_REVIEW: "bg-info/10 text-info border border-info/20",
    IN_PROGRESS: "bg-info/10 text-info border border-info/20",
    APPROVED: "bg-success/10 text-success border border-success/20",
    VERIFIED: "bg-success/10 text-success border border-success/20",
    ACTIVE: "bg-success/10 text-success border border-success/20",
    PLEDGED: "bg-success/10 text-success border border-success/20",
    DISBURSED: "bg-primary/10 text-primary border border-primary/20",
    REJECTED: "bg-destructive/10 text-destructive border border-destructive/20",
    CANCELLED: "bg-destructive/10 text-destructive border border-destructive/20",
    CLOSED: "bg-muted text-muted-foreground",
    DEFAULT: "bg-destructive/10 text-destructive border border-destructive/20",
    NPA: "bg-destructive/10 text-destructive border border-destructive/20",
    RELEASED: "bg-muted text-muted-foreground",
    LIQUIDATED: "bg-destructive/10 text-destructive border border-destructive/20",
  };
  return statusColors[status] || "bg-muted text-muted-foreground";
}

export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar || aadhaar.length !== 12) return aadhaar;
  return `XXXX XXXX ${aadhaar.slice(-4)}`;
}

export function maskPan(pan: string): string {
  if (!pan || pan.length !== 10) return pan;
  return `${pan.slice(0, 2)}XXXXX${pan.slice(-3)}`;
}

export function validateAadhaar(aadhaar: string): boolean {
  return /^\d{12}$/.test(aadhaar.replace(/\s/g, ""));
}

export function validatePan(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""));
}
