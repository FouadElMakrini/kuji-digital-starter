import { z } from "zod";

export const prizeTierSchema = z.object({
  letter: z.string().min(1).max(5),
  label: z.string().min(1).max(100),
  quantity: z.number().int().positive().max(999),
  imageUrl: z.string().max(500).optional().or(z.literal(""))
});

export const createKujiSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["draft", "active", "closed"]).default("draft"),
  gridColumns: z.number().int().min(3).max(10),
  coverImageUrl: z.string().max(500).optional().or(z.literal("")),
  sourceUrl: z.string().max(500).optional().or(z.literal("")),
  prizeTiers: z.array(prizeTierSchema).min(1)
});

export const createSessionSchema = z.object({
  kujiId: z.string().min(1),
  allowedDraws: z.number().int().positive().max(100),
  expiresInMinutes: z.number().int().min(0).max(1440).default(0)
});

export const openTicketSchema = z.object({
  code: z.string().min(1),
  ticketId: z.string().min(1)
});
