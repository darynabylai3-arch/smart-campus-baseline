import { useEffect, useMemo, useRef, useState } from "react";
import { createMockAdapter, MockMode } from "@/explain/adapters";
import { ExplainInput } from "@/explain/contract";
import { explainAvailability, ExplainResult } from "@/explain/explainAvailability";

interface Props {
  input: ExplainInput;
}

const MODES: MockMode[] = ["normal", "slow", "error", "invalid"];

// Maps the error strings produced by explainAvailability to a user-facing note.
function fallbackNote(error: string | undefined): string {
  if (error?.startsWith("Model timed out")) return "The model did not answer in time.";
  if (error?.startsWith("Invalid model output:")) return "The model's answer was rejected by validation.";
  if (error?.startsWith("Invalid input:")) return "The request could not be sent to the model.";
  return "The model is unavailable.";
}

export function ExplainPanel({ input }: Props) {
  const [mode, setMode] = useState<MockMode>("normal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const requestId = useRef(0);
  const adapter = useMemo(() => createMockAdapter(mode), [mode]);

  // Clear the explanation (and ignore any in-flight response) when the decision changes.
  const { roomLabel, start, end, isAvailable, reasonCode } = input;
  useEffect(() => {
    requestId.current += 1;
    setResult(null);
    setLoading(false);
    return () => {
      requestId.current += 1;
    };
  }, [roomLabel, start, end, isAvailable, reasonCode]);

  async function handleExplain() {
    const id = ++requestId.current;
    setLoading(true);
    setResult(null);
    const r = await explainAvailability(input, adapter);
    if (id !== requestId.current) return; // stale
    setResult(r);
    setLoading(false);
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <button
          type="button"
          onClick={handleExplain}
          disabled={loading}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Generating explanation…" : "Explain availability"}
        </button>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="mock-mode">
            Mock model behaviour (demo)
          </label>
          <select
            id="mock-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as MockMode)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {result && (
        <div
          className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4"
          role="status"
          data-source={result.source}
        >
          <p className="mb-1 text-xs font-semibold text-slate-500">
            {result.source === "model"
              ? "AI-generated explanation (mock model) — not a booking confirmation"
              : "Standard explanation (not AI-generated) — not a booking confirmation"}
          </p>
          <p className="text-sm text-slate-700">{result.explanation}</p>
          {result.source === "fallback" && (
            <p className="mt-2 text-xs text-amber-700">{fallbackNote(result.error)}</p>
          )}
        </div>
      )}
    </div>
  );
}
