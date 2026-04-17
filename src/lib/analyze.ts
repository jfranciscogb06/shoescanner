import { anthropic } from "./anthropic";
import { ShoeAnalysisSchema, type ShoeAnalysis } from "./types";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const SYSTEM_PROMPT = `You are a sneaker expert and authenticator evaluating shoes for resale pricing.

You will receive 4 photos in order: LEFT side, RIGHT side, TOP (top-down), SOLE (bottom).

Your job:
1. Identify the shoe (brand, model, colorway). Use the tongue tag for SKU and size if visible.
2. Grade condition on this scale:
   - DS (deadstock): Factory new, never worn, all creases only on toe flex points from handling.
   - VNDS (very near deadstock): Worn 1-5 times, no permanent creasing, clean sole with minor pattern wear.
   - USED: Obvious creases on toe box, dirt/scuffs, sole wear pattern clear but intact.
   - BEAT: Deep creasing, yellowing/oxidized midsole, heavy sole wear, visible damage or repairs.
3. List specific flaws with location and severity.
4. Assign a 0-100 condition score (100=factory new).

Be honest and specific — resellers rely on this to price and list accurately. If identification is uncertain, set identified=false and leave brand/model empty rather than guessing.`;

export async function analyzeShoe(photos: {
  left: string;    // data URL or https URL
  right: string;
  top: string;
  sole: string;
}): Promise<ShoeAnalysis> {
  const imageBlock = (src: string) => {
    if (src.startsWith("data:")) {
      const [meta, data] = src.split(",");
      const mediaType = meta.slice(5, meta.indexOf(";")) as
        | "image/jpeg"
        | "image/png"
        | "image/webp"
        | "image/gif";
      return {
        type: "image" as const,
        source: { type: "base64" as const, media_type: mediaType, data },
      };
    }
    return {
      type: "image" as const,
      source: { type: "url" as const, url: src },
    };
  };

  const response = await anthropic.messages.parse({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Photo 1: LEFT side" },
          imageBlock(photos.left),
          { type: "text", text: "Photo 2: RIGHT side" },
          imageBlock(photos.right),
          { type: "text", text: "Photo 3: TOP (top-down view)" },
          imageBlock(photos.top),
          { type: "text", text: "Photo 4: SOLE (bottom)" },
          imageBlock(photos.sole),
          {
            type: "text",
            text: "Analyze the shoe. Identify it, grade condition, and list every flaw.",
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(ShoeAnalysisSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude could not produce structured output for this shoe");
  }
  return response.parsed_output;
}
