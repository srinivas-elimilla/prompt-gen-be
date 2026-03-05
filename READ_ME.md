🧠 What Is RAG (Retrieval‑Augmented Generation)?
RAG is a method that helps AI give more accurate and useful answers by letting it look things up instead of guessing.
Think of it like this:
👍 Simple Explanation
RAG means:
1) Search for the right information (Retrieve)
2) Use that information to generate the final answer (Augmented Generation)
So instead of the AI trying to remember everything, it pulls relevant info from a database or documents first, then responds.

📚 Real‑World Analogy
Imagine someone asks you:

“How do I build a login system with Express?”

You:

Search your notes or Google for “Express auth code examples”.
Read what you found.
Explain the solution using that information.

That process = RAG.

🤖 Why RAG Helps AI
Without RAG → the AI guesses based on what it learned during training.
With RAG → the AI retrieves current, specific, accurate information from your data source.
So answers become:

More reliable
More up‑to‑date
More relevant to your exact documents
Less prone to hallucination


🏗️ What RAG Looks Like in Your Backend
Your system does:

Embed the query → convert text to a vector.
Search Postgres (pgvector) → find similar patterns.
Inject those patterns into the prompt.
Generate a final prompt based on real data.

So the final result is grounded in actual retrieved examples, not guesses.

📌 One‑Sentence Definition
RAG = an AI method where the model retrieves relevant data first, then uses it to produce more accurate responses.









AI Prompt Generator Backend — README
Overview
This backend converts natural‑language coding requests into structured intent, retrieves relevant coding patterns using local embeddings + pgvector/Postgres, and generates deterministic prompt templates for downstream LLM use.
Pipeline:
Route → Controller → Interpret Service → Retriever → Composer → Response

Endpoint
POST /prompt/generate
Example Request
JSON{  "query": "Build an Express + TypeScript REST API for a Product catalog with CRUD using PostgreSQL + Prisma, including validation with Zod, pagination, and error handling middleware."}Show more lines

System Architecture
1) Controller (prompt.controller.ts)
Entry point for the API.
Responsibilities

Validate input
Interpret query → structured intent
Build retrieval query for RAG
Retrieve top semantic patterns
Compose final prompts
Return JSON response

Key Flow
TypeScriptvalidate(query)intent = interpretQuery(query)retrievalQuery = buildRetrievalQuery(intent)patterns = retrievePatternsHF(retrievalQuery, 3)prompts = composeCodingPrompts(intent, patterns)return { intent, rag, prompts }Show more lines

2) Interpret Service (interpret.ts)
Uses an LLM (via fallback router) to convert natural language → validated JSON.
Features

Groq Llama model (configurable fallback chain)
Zod schema enforcement (withStructuredOutput)
Deterministic, structured intent fields such as:

goal
techStack
mustInclude
mustAvoid
successCriteria
assumptions




3) LLM Router (llmRouter.ts)
Provides provider fallback for reliability and cost flexibility.
Flow: OpenAI → Anthropic → Groq (current active: Groq)

4) Embeddings (localEmbeddings.ts)
Local embedding generation using:
Model: Xenova/all-MiniLM-L6-v2
Output: 384‑dimension vector
Used for semantic RAG retrieval.

5) Retriever Service (patternRetriever.ts)
Fetches relevant patterns from Postgres using pgvector.
SQL Query
SQLSELECT id, title, content,       1 - (embedding <=> $1::vector) AS scoreFROM prompt_patterns_hfORDER BY embedding <=> $1::vectorLIMIT $2;Show more lines
Notes

<=> = cosine distance
score = 1 - distance
Optional filtering: score >= 0.2


6) Composer Service (promptComposer.ts)
Combines:

Structured intent
Top‑K retrieved patterns

…and produces:

finalPrompt
variants.fast
variants.detailed
variants.strict

This step is template‑based (no LLM), ensuring consistency and production stability.

7) Final Response Structure
JSON{  "interpretProvider": "groq",  "intent": { ... },  "rag": {    "provider": "hf_local",    "query": "...",    "topK": [ ... ]  },  "prompts": {    "finalPrompt": "...",    "variants": { ... }  }}Show more lines

Summary
This project implements a full RAG‑powered prompting backend with:

Structured LLM interpretation
Provider fallback routing
Local embeddings (HuggingFace)
Vector search (pgvector/Postgres)
Deterministic prompt generation
Clean separation of concerns across Controller, Services, and Database layers

This architecture is production‑ready, extensible, and optimized for consistent, predictable prompt creation.