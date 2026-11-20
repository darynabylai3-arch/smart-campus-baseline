import type { ReasonCode } from "@/types";
import type { LlmAdapter } from "./adapters";
import { ExplainInput, validateExplainInput, validateExplanation } from "./contract";
import { buildPrompt } from "./prompt";

export interface ExplainResult {
  source: "model" | "fallback";
  explanation: string;
  error?: string;
}

const FALLBACKS: Record<ReasonCode, string> = {
  AVAILABLE: "The room is available for the requested time.",
  NO_ROOM: "No room is selected, so the request cannot be checked.",
  INVALID_TIME: "The room is not available because the start or end time is not valid.",
  INVALID_RANGE: "The room is not available because the end time must be after the start time.",
  PAST_START: "The room is not available because the start time must be after the current time.",
  TOO_LONG: "The room is not available because bookings cannot exceed 120 minutes.",
  ROOM_BLOCKED: "The room is blocked and cannot be booked.",
  OVERLAP: "The room is not available because it overlaps an existing booking.",
};

const GENERIC_FALLBACK = "No explanation could be generated for this request.";

export function fallbackExplanation(code: unknown): string {
  return typeof code === "string" && Object.prototype.hasOwnProperty.call(FALLBACKS, code)
    ? FALLBACKS[code as ReasonCode]
    : GENERIC_FALLBACK;
}

export async function explainAvailability(
  input: ExplainInput,
  adapter: LlmAdapter,
  { timeoutMs = 3000 }: { timeoutMs?: number } = {}
): Promise<ExplainResult> {
  const check = validateExplainInput(input);
  if (!check.ok) {
    return {
      source: "fallback",
      explanation: fallbackExplanation((input as Partial<ExplainInput> | null)?.reasonCode),
      error: `Invalid input: ${check.error}`,
    };
  }

  // Work on a private copy so the caller's object is never touched.
  const snapshot: ExplainInput = { ...input };
  const fallback = (error: string): ExplainResult => ({
    source: "fallback",
    explanation: fallbackExplanation(snapshot.reasonCode),
    error,
  });

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Model timed out after ${timeoutMs} ms`));
    }, timeoutMs);
  });

  let text: string;
  try {
    const pending = adapter.generate(buildPrompt(snapshot), controller.signal);
    pending.catch(() => undefined); // avoid unhandled rejection if the timeout wins
    text = await Promise.race([pending, timeout]);
  } catch (e) {
    return fallback(e instanceof Error ? e.message : "Model call failed");
  } finally {
    clearTimeout(timer);
  }

  const out = validateExplanation(text, snapshot);
  if (!out.ok) return fallback(`Invalid model output: ${out.error}`);
  return { source: "model", explanation: text.trim() };
}
