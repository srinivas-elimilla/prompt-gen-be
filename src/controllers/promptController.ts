import { interpretQuery } from "../services/interpret";
import { composeCodingPrompts } from "../services/promptComposer";
import { retrievePatternsHF } from "../services/patternRetriever";

export const promptController = async (req: any, res: any) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query (string) required" });
    }

    // 1) Interpret (LLM)
    const interpreted = await interpretQuery(query);
    const intent = interpreted.intent;

    // 2) Retrieve (RAG) - build a better retrieval query than just goal
    const retrievalQuery = [
      intent.goal,
      intent.constraints.techStack?.join(" "),
      intent.constraints.mustInclude?.join(" "),
    ]
      .filter(Boolean)
      .join(" | ");

    const patterns = await retrievePatternsHF(retrievalQuery, 3);

    // Optional: filter weak matches (tune threshold)
    const filteredPatterns = patterns.filter((p) => p.score >= 0.2);

    // 3) Compose (inject retrieved patterns into the prompt)
    const prompts = composeCodingPrompts(intent, filteredPatterns);

    res.json({
      interpretProvider: interpreted.provider,
      intent,
      rag: {
        provider: "hf_local",
        query: retrievalQuery,
        topK: filteredPatterns.map((p) => ({
          id: p.id,
          title: p.title,
          score: p.score,
        })),
      },
      prompts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
