import type { Intent } from "../schemas/intent.schema";

function bullet(list: string[]) {
  return list.length ? list.map((x) => `- ${x}`).join("\n") : "- (none)";
}

function renderPatterns(
  patterns: { title: string; content: string; score?: number }[],
) {
  if (!patterns.length) return "Reference patterns: none";
  return [
    "Reference patterns (adapt only if relevant):",
    ...patterns.map((p, i) => {
      const score =
        typeof p.score === "number" ? ` (score: ${p.score.toFixed(3)})` : "";
      return `Pattern ${i + 1}: ${p.title}${score}\n${p.content}`;
    }),
  ].join("\n\n---\n\n");
}

function buildAssumptions(intent: Intent) {
  const items: string[] = [];

  if (intent.language !== "unknown") {
    items.push(`Use ${intent.language} as the primary language.`);
  }

  if (intent.framework.length) {
    items.push(`Use framework(s): ${intent.framework.join(", ")}.`);
  }

  if (intent.runtime.length) {
    items.push(`Target runtime/environment: ${intent.runtime.join(", ")}.`);
  }

  items.push("Follow ecosystem best practices.");
  items.push("Use clear project structure.");
  items.push("Add validation and error handling where appropriate.");

  return items;
}

export function composeCodingPrompts(
  intent: Intent,
  patterns: { title: string; content: string; score?: number }[] = [],
) {
  const patternBlock = renderPatterns(patterns);
  const assumptions = buildAssumptions(intent);

  const finalPrompt = `
You are a senior software engineer.

Goal:
${intent.goal}

Task type:
${intent.taskType}

Language:
${intent.language}

Framework:
${intent.framework.join(", ") || "Not specified"}

Runtime:
${intent.runtime.join(", ") || "Not specified"}

Tech stack:
${bullet(intent.constraints.techStack)}

Must include:
${bullet(intent.constraints.mustInclude)}

Must avoid:
${bullet(intent.constraints.mustAvoid)}

Inputs provided:
${bullet(intent.inputsProvided)}

Assumptions:
${bullet(assumptions)}

Success criteria:
${bullet(intent.successCriteria)}

${patternBlock}

OUTPUT FORMAT:
1. First print a folder tree.
2. Then print each file in this exact format:

<<<FILE: path/to/file.ext>>>
\`\`\`language
...content...
\`\`\`

3. Use the correct language fence for each file.
4. Do not add unnecessary commentary outside file blocks unless requested.

Task:
Generate the solution according to the user's requested language, framework, and constraints.
`.trim();

  return { finalPrompt };
}