import { z } from 'zod';

export const urlSchema = z.string().url();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export function validateUrl(url: string): boolean {
  const result = urlSchema.safeParse(url);
  return result.success;
}
