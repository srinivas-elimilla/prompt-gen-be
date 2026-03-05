import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";

export async function callWithFallback(fn: (model: any) => Promise<any>) {
  const providers = (process.env.LLM_PRIORITY || "openai,anthropic,groq")
    .split(",")
    .map(p => p.trim());

  let lastError: any;

  for (const provider of providers) {
    try {
      let model;

      if (provider === "openai" && process.env.OPENAI_API_KEY) {
        model = new ChatOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL,
          temperature: 0.2
        });
      }

      if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
        model = new ChatAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL,
          temperature: 0.2
        });
      }

      if (provider === "groq" && process.env.GROQ_API_KEY) {
        model = new ChatGroq({
          apiKey: process.env.GROQ_API_KEY,
          model: process.env.GROQ_MODEL,
          temperature: 0.2
        });
      }

      if (!model) continue;

      const result = await fn(model);
      return { provider, result };

    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}
