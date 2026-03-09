import { IntentSchema } from "../schemas/intent.schema";
import { callWithFallback } from "./llmRouter";

export async function interpretQuery(query: string) {
  console.log("Interpreting query ...");
  const system = `
You are a senior software architect.
Extract a strict JSON "Intent" from the user's coding request.

Rules:
- Choose taskType from the allowed enum (be specific).
- Put explicit requirements into constraints.mustInclude (e.g., pagination, validation, error middleware, folder structure).
- Fill successCriteria with clear "done" checks (at least 2).
- Fill framework/runtime if inferable (Express => framework includes "Express"; runtime includes "Node.js").
- Ask 0 questions if possible; only ask up to 3 if absolutely required.
Return ONLY JSON as per schema.
`.trim();

  const { provider, result } = await callWithFallback(async (model) => {
    const structured = model.withStructuredOutput(IntentSchema);
    return structured.invoke([
      ["system", system],
      ["user", query],
    ]);
  });

  return { provider, intent: result };
}
