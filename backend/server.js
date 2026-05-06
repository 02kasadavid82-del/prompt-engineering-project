const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors());

const PORT = Number(process.env.PORT || 3001);
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

function nowIso() {
  return new Date().toISOString();
}

// Minimal request logging for debugging (no extra deps).
app.use((req, res, next) => {
  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const reqId = Math.random().toString(16).slice(2, 10);

  console.log(`[${nowIso()}] [${reqId}] --> ${method} ${url}`);

  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[${nowIso()}] [${reqId}] <-- ${method} ${url} ${res.statusCode} (${ms}ms)`
    );
  });

  next();
});

function loadDilemmas() {
  const dilemmasPath = path.join(__dirname, "data", "dilemmas.json");
  const raw = fs.readFileSync(dilemmasPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("dilemmas.json must be an array");
  return parsed;
}

function aggregateTags(answers) {
  const tagCounts = {};
  for (const a of answers) {
    const tags = Array.isArray(a?.tags) ? a.tags : [];
    for (const t of tags) {
      if (typeof t !== "string" || !t.trim()) continue;
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }
  return tagCounts;
}

function extractOutputText(response) {
  if (response && typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const outputs = Array.isArray(response?.output) ? response.output : [];
  for (const item of outputs) {
    const contents = Array.isArray(item?.content) ? item.content : [];
    for (const c of contents) {
      if (c?.type === "output_text" && typeof c.text === "string" && c.text.trim()) {
        return c.text.trim();
      }
    }
  }

  return "";
}

app.get("/dilemmas", (req, res) => {
  try {
    const dilemmas = loadDilemmas();
    res.json(dilemmas);
  } catch (err) {
    console.error(`[${nowIso()}] GET /dilemmas failed`, err);
    res.status(500).json({ error: "Failed to load dilemmas" });
  }
});

app.post("/analyze", async (req, res) => {
  try {
    const { answers, tagCounts: tagCountsFromClient } = req.body || {};
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "answers must be a non-empty array" });
    }
    if (answers.length !== 10) {
      return res.status(400).json({ error: "This endpoint expects exactly 10 answers" });
    }

    const tagCounts =
      tagCountsFromClient && typeof tagCountsFromClient === "object"
        ? tagCountsFromClient
        : aggregateTags(answers);

    const tagsExpanded = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => `${tag} (${count})`)
      .join(", ");

    const tagList = Object.keys(tagCounts)
      .sort()
      .join(", ");

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are an expert in ethical decision-making, behavioral psychology, and moral philosophy.

A user has completed a series of ethical dilemmas. Each answer includes descriptive tags (e.g., altruistic, pragmatic, risk-averse, honest, selfish, etc.).

Your task is to analyze the user's overall decision-making style and generate a structured, insightful evaluation.

---

## Input

You will receive a list of tags representing the user's choices.

---

## Instructions

1. Identify meaningful behavioral patterns in the data.

2. Dynamically define 3–4 relevant evaluation categories based on the user's answers.

   * Do NOT use fixed categories
   * Choose categories that best describe the user's tendencies

3. For each category:

   * Give it a clear name
   * Assign a percentage score (0–100%)
   * Provide a short but insightful explanation (2–4 sentences)

4. Also generate a strong, concise headline that summarizes the user's overall ethical profile.

5. Write everything in second person, directly addressing the user (e.g., “You tend to…”, “You are…”, “You often…”).

---

## Output Format (STRICT)

Return ONLY valid JSON in the following structure:

{
\"headline\": \"Short, impactful summary of the user's ethical style\",
\"summary\": \"3–5 sentence overall interpretation of the user's decision-making patterns\",
\"categories\": [
{
\"name\": \"Category name\",
\"score\": 75,
\"description\": \"Explanation of this trait and how it appears in the user's decisions\"
}
]
}

---

## Style Guidelines

* Be insightful but not overly academic
* Avoid generic statements
* Make the analysis feel personalized and specific
* Use clear, human-readable language
* Ensure category names are intuitive (e.g., \"Risk Sensitivity\", \"Fairness Orientation\", \"Pragmatism vs Idealism\")

---

## Data to Analyze

Tags:
${tagsExpanded || tagList || "(no tags provided)"}

---

Return ONLY the JSON. Do not include any extra text.`;

    const schema = {
      name: "EthicalProfileAnalysis",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          summary: { type: "string" },
          categories: {
            type: "array",
            minItems: 3,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                score: { type: "integer", minimum: 0, maximum: 100 },
                description: { type: "string" }
              },
              required: ["name", "score", "description"]
            }
          }
        },
        required: ["headline", "summary", "categories"]
      }
    };

    let analysis = null;
    try {
      const response = await client.responses.create({
        model: MODEL,
        input: [{ role: "user", content: prompt }],
        text: {
          format: {
            type: "json_schema",
            name: schema.name,
            strict: true,
            schema: schema.schema
          }
        }
      });
      const jsonText = extractOutputText(response);
      analysis = JSON.parse(jsonText || "null");
    } catch (err) {
      console.warn(
        `[${nowIso()}] POST /analyze: json_schema parse/response failed; using fallback text prompt`,
        err
      );
      const fallbackPrompt = `Analyze the user's overall ethical decision-making style from these tags.

Tags:
${tagsExpanded || tagList || "(no tags provided)"}

Return a concise 3–5 sentence summary only.`;

      const response = await client.responses.create({
        model: MODEL,
        input: [{ role: "user", content: fallbackPrompt }]
      });

      const text = extractOutputText(response);
      if (!text) return res.status(502).json({ error: "Empty analysis from model" });
      analysis = { headline: "Ethical profile", summary: text, categories: [] };
    }

    if (!analysis || typeof analysis !== "object") {
      return res.status(502).json({ error: "Invalid analysis from model" });
    }

    res.json({ analysis });
  } catch (err) {
    console.error(`[${nowIso()}] POST /analyze failed`, err);
    res.status(500).json({ error: "Failed to analyze answers" });
  }
});

app.listen(PORT, () => {
  console.log(`[${nowIso()}] Backend listening on http://localhost:${PORT}`);
});

