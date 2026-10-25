import { z } from "zod";
import { compilePrompt, dimensions, type GenerationInput } from "./contracts";
import { getModel } from "./catalog";

export const graphSchema = z.record(z.string(), z.object({
  class_type: z.string(),
  inputs: z.record(z.string(), z.unknown()),
  _meta: z.unknown().optional(),
}));
export type Graph = z.infer<typeof graphSchema>;
const bindingSchema = z.object({ node: z.string(), input: z.string() });
export const profileSchema = z.object({
  workflow: z.string(),
  bindings: z.object({
    prompt: bindingSchema,
    seed: bindingSchema,
    width: bindingSchema,
    height: bindingSchema,
    frames: bindingSchema.optional(),
    fps: bindingSchema.optional(),
  }),
  outputNodes: z.array(z.string()).min(1),
});
export type Profile = z.infer<typeof profileSchema>;

export function validateBindings(graph: Graph, profile: Profile, video: boolean) {
  for (const [key, binding] of Object.entries(profile.bindings)) {
    if (!binding || !graph[binding.node] || !(binding.input in graph[binding.node].inputs)) {
      throw new Error(`Invalid ${key} binding in workflow profile.`);
    }
  }
  for (const node of profile.outputNodes) {
    if (!graph[node]) throw new Error(`Output node ${node} is missing.`);
  }
  if (video && (!profile.bindings.frames || !profile.bindings.fps)) {
    throw new Error("Video workflows must bind both frames and fps.");
  }
}

export function buildWorkflow(source: Graph, profile: Profile, input: GenerationInput): Graph {
  const video = getModel(input.modelId)?.kind === "video";
  validateBindings(source, profile, video);
  const graph = structuredClone(source);
  // Wan's temporal VAE expects a 4n+1 frame count; 73/121 frames at 24 fps.
  const values: Record<string, unknown> = { prompt: compilePrompt(input), seed: input.seed, ...dimensions(input), frames: input.duration * 24 + 1, fps: 24 };
  for (const [key, binding] of Object.entries(profile.bindings)) {
    if (binding) graph[binding.node].inputs[binding.input] = values[key];
  }
  return graph;
}
