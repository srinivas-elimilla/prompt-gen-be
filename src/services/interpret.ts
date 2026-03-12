import { IntentSchema } from "../schemas/intent.schema";
import { callWithFallback } from "./llmRouter";

export async function interpretQuery(query: string) {
  console.log("Interpreting query ...");
  const system = `
You are a senior software architect.
Extract a strict JSON "Intent" from the user's coding request.

Rules:
- Detect the user's requested programming language exactly if mentioned.
- Detect framework exactly if mentioned.
- Do NOT infer Node.js or Express unless the user explicitly asks for it or it is strongly implied.
- If user asks for Python, runtime should include Python.
- If user asks for Java, runtime should include JVM or Java.
- If user asks for Spring Boot, include framework "Spring Boot".
- If user asks for Flask/FastAPI/Django, include the correct Python framework.
- Put explicit requirements into constraints.mustInclude.
- Fill successCriteria with at least 2 concrete checks.
- Return ONLY JSON as per schema.
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
