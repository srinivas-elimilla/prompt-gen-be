import { z } from "zod";
import type { Intent } from "../schemas/intent.schema";
import { callWithFallback } from "./llmRouter";

const GeneratedPromptsSchema = z.object({
  finalPrompt: z.string().min(50),
  variants: z.object({
    fast: z.string().min(30),
    detailed: z.string().min(30),
    strict: z.string().min(30),
  }),
});

export async function generatePromptsFromIntent(intent: Intent) {
  const system = `
You are a senior prompt engineer specialized ONLY in software/coding prompts.
Given an Intent JSON, produce prompts that will reliably generate correct code.

Rules:
- The prompts must be self-contained and explicit.
- Include tech stack, constraints, mustInclude, mustAvoid, and successCriteria.
- Ensure the prompt enforces output format exactly.
- Do NOT ask clarifying questions inside prompts; instead, encode assumptions.
Return ONLY JSON matching the required schema.
`.trim();

  const user = `
Intent JSON:
${JSON.stringify(intent, null, 2)}

Generate:
- finalPrompt (best overall)
- variants.fast (shorter, minimal explanation)
- variants.detailed (step-by-step with plan, edge cases, tests)
- variants.strict (very strict formatting rules: folder structure + per-file code blocks)
`.trim();

  const { provider, result } = await callWithFallback(async (model) => {
    const structured = model.withStructuredOutput(GeneratedPromptsSchema);
    return structured.invoke([
      ["system", system],
      ["user", user],
    ]);
  });

  return { provider, prompts: result };
}
