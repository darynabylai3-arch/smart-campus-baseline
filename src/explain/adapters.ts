import type { ExplainInput } from "./contract";

// NOTE: a real model adapter must run server-side (behind your own backend endpoint)
// so that API keys never reach the browser. Only this mock exists in the client.

export interface LlmAdapter {
  name: string;
  generate(prompt: { system: string; user: string }, signal: AbortSignal): Promise<string>;
}

export type MockMode = "normal" | "slow" | "error" | "invalid";

const SLOW_MS = 10_000;

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Aborted"));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("Aborted"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

// The mock only sees the prompt text, so it reads the input back from the JSON inside <data>.
function readInput(prompt: { user: string }): ExplainInput {
  const m = /^<data>([\s\S]*)<\/data>$/.exec(prompt.user);
  if (!m) throw new Error("Malformed prompt");
  return JSON.parse(m[1]) as ExplainInput;
}

function template(i: ExplainInput): string {
  const label = i.roomLabel;
  switch (i.reasonCode) {
    case "AVAILABLE":
      return `${label} is available from ${i.start} to ${i.end}. This is only a check, not a booking confirmation.`;
    case "NO_ROOM":
      return "No room is selected, so the request cannot be checked.";
    case "INVALID_TIME":
      return `${label} is not available because the start or end time is not valid.`;
    case "INVALID_RANGE":
      return `${label} is not available because the end time must be after the start time.`;
    case "PAST_START":
      return `${label} is not available because the start time ${i.start} is not after the current time.`;
    case "TOO_LONG":
      return `${label} is not available from ${i.start} to ${i.end} because bookings cannot exceed 120 minutes.`;
    case "ROOM_BLOCKED":
      return `${label} is blocked and cannot be booked from ${i.start} to ${i.end}.`;
    case "OVERLAP":
      return `${label} is not available from ${i.start} to ${i.end} because it overlaps an existing booking.`;
  }
}

export function createMockAdapter(mode: MockMode, delayMs = 300): LlmAdapter {
  return {
    name: `mock-${mode}`,
    async generate(prompt, signal) {
      if (mode === "slow") {
        await wait(SLOW_MS, signal);
        return template(readInput(prompt));
      }
      await wait(delayMs, signal);
      if (mode === "error") throw new Error("Simulated API failure");
      const input = readInput(prompt);
      if (mode === "invalid") {
        // Deliberately contradicts the real status.
        return input.isAvailable
          ? "The room is blocked and not available for any time."
          : "The room is available for any time you like.";
      }
      return template(input);
    },
  };
}
