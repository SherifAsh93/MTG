import { z } from "zod";
import { cameraMoves, getModel, looks } from "./catalog";

export const generationSchema = z.object({
  prompt: z.string().trim().min(3, "Describe your shot in at least 3 characters.").max(4000),
  project: z.string().trim().min(1).max(100).default("Untitled film"),
  modelId: z.string().refine(id => !!getModel(id), "Unknown model."),
  aspect: z.enum(["16:9", "9:16", "1:1"]),
  duration: z.union([z.literal(3), z.literal(5)]).default(5),
  seed: z.number().int().min(0).max(2147483647),
  camera: z.enum(["static", "dolly", "orbit", "crane", "handheld"]),
  look: z.enum(["natural", "golden", "noir", "dream"]),
  action: z.enum(["draft", "generate"]),
}).superRefine((data, ctx) => {
  if (getModel(data.modelId)?.kind === "video" && data.aspect === "1:1") {
    ctx.addIssue({ code: "custom", path: ["aspect"], message: "Use landscape or portrait for the video workflow." });
  }
});

export type GenerationInput = z.infer<typeof generationSchema>;
export type Asset = { filename: string; subfolder: string; type: "output"; kind: "image" | "video" };
export type Job = {
  id: string;
  createdAt: string;
  status: "draft" | "submitting" | "queued" | "completed" | "failed";
  input: GenerationInput;
  compiledPrompt: string;
  promptId?: string;
  assets: Asset[];
  error?: string;
};
export type Connection = {
  connected: boolean;
  configured: boolean;
  message: string;
  models: { id: string; configured: boolean; ready: boolean; detail: string }[];
};

export function compilePrompt(input: GenerationInput) {
  const image = getModel(input.modelId)?.kind === "image";
  return [input.prompt, looks[input.look], ...(image ? [] : [cameraMoves[input.camera]])].join(". ");
}

export function dimensions(input: GenerationInput) {
  if (getModel(input.modelId)?.kind === "video") {
    return input.aspect === "9:16" ? { width: 704, height: 1280 } : { width: 1280, height: 704 };
  }
  return input.aspect === "16:9" ? { width: 1344, height: 768 } : input.aspect === "9:16" ? { width: 768, height: 1344 } : { width: 1024, height: 1024 };
}
