type RodiumMessage = { role: "system" | "user" | "assistant"; content: string };

type RodiumResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cost_rodi?: number;
  };
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```json([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function rodiumChatJson(params: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<{ json: unknown; model: string; raw: string } | null> {
  const apiKey = process.env.RODIUMAI_API_KEY?.trim();
  if (!apiKey) return null;

  const baseUrl = (process.env.RODIUMAI_BASE_URL?.trim() || "https://api.rodiumai.io/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.RODIUMAI_MODEL?.trim() || "rodiumai/smart";
  const messages: RodiumMessage[] = [
    { role: "system", content: params.system },
    { role: "user", content: params.user },
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: params.temperature ?? 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as RodiumResponse;
  const raw = data.choices?.[0]?.message?.content ?? "";
  return {
    json: extractJson(raw),
    model: data.model ?? model,
    raw,
  };
}
