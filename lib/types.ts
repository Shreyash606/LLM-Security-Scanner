import { z } from "zod";

export const FindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(["low","medium","high","critical"]),
  filePath: z.string(),
  startLine: z.number().int().min(1),
  endLine: z.number().int().min(1),
  rule: z.string().optional(),
  description: z.string(),
  recommendation: z.string().optional(),
});

export const SummarySchema = z.object({
  filesEnumerated: z.number(),
  filesConsidered: z.number(),
  filesScanned: z.number(),
  bytesScanned: z.number(),
  errors: z.number()
});

export const ScanResultSchema = z.object({
  repo: z.string(),
  commit: z.string(),
  findings: z.array(FindingSchema),
  summary: SummarySchema.optional()
});

export type Finding = z.infer<typeof FindingSchema>;
export type ScanResult = z.infer<typeof ScanResultSchema>;


