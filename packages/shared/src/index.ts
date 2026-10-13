import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const customerSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  type: z.enum(['personal', 'business']).default('business'),
  status: z.enum(['lead', 'active', 'inactive']).default('lead'),
  sourceName: z.string().optional(),
  notes: z.string().optional(),
});

export const opportunitySchema = z.object({
  name: z.string().min(1),
  customerId: z.string().min(1),
  stageId: z.string().min(1),
  value: z.number().nonnegative().default(0),
  expectedCloseDate: z.string().optional(),
  description: z.string().optional(),
});

export const quoteInputSchema = z.object({
  workingDays: z.number().int().positive(),
  freelancers: z.number().int().nonnegative(),
  freelanceRate: z.number().nonnegative(),
  vpsDomain: z.number().nonnegative().default(0),
  buffer: z.number().nonnegative().default(0),
  commissionRate: z.number().nonnegative().default(0),
  entertainmentRate: z.number().nonnegative().default(0),
  otherRate: z.number().nonnegative().default(0),
  profitMargin: z.number().nonnegative().default(0),
  manualPrice: z.number().nonnegative().nullable().optional(),
});

export type QuoteInput = z.infer<typeof quoteInputSchema>;

export type QuotePricing = {
  personnelCost: number;
  otherCost: number;
  totalCost: number;
  sellingPrice: number;
};

/** Chi phí nhân sự + phụ phí + biên lợi nhuận. Giá thủ công ghi đè giá bán. */
export function priceQuote(input: QuoteInput): QuotePricing {
  const personnelCost = input.workingDays * input.freelancers * input.freelanceRate;
  const base = personnelCost + input.vpsDomain + input.buffer;
  const commission = Math.round(base * (input.commissionRate / 100));
  const entertainment = Math.round(base * (input.entertainmentRate / 100));
  const other = Math.round(base * (input.otherRate / 100));
  const otherCost = input.vpsDomain + input.buffer + commission + entertainment + other;
  const totalCost = personnelCost + otherCost;
  const sellingPrice =
    input.manualPrice ?? Math.round(totalCost * (1 + input.profitMargin / 100));
  return { personnelCost, otherCost, totalCost, sellingPrice };
}

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type OpportunityInput = z.infer<typeof opportunitySchema>;
