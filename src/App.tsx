import { useMemo, useState } from "react";
import { Building2, Clock, Search } from "lucide-react";
import { RoomSelector } from "@/components/RoomSelector";
import { Timeline } from "@/components/Timeline";
import { ResultPanel } from "@/components/ResultPanel";
import { SAMPLE_BOOKINGS, SAMPLE_ROOMS } from "@/sampleData";
import { checkAvailability, getInputHints } from "@/availability";
import { labelToMinutes, minutesToLabel, durationLabel } from "@/timeUtils";
import { Decision } from "@/types";
import { ExplainPanel } from "@/components/ExplainPanel";
import { ExplainInput } from "@/explain/contract";

function App() {
  const [roomId, setRoomId] = useState<string | null>(SAMPLE_ROOMS[0].id);
  const [currentLabel, setCurrentLabel] = useState("10:15");
  const [startLabel, setStartLabel] = useState("10:30");
  const [endLabel, setEndLabel] = useState("11:30");
  const currentMinutes = labelToMinutes(currentLabel);

  const room = useMemo(
    () => SAMPLE_ROOMS.find((r) => r.id === roomId) ?? null,
    [roomId]
  );

  const startMin = labelToMinutes(startLabel);
  const endMin = labelToMinutes(endLabel);

  const decision: Decision | null = useMemo(() => {
    if (startMin === null || endMin === null || currentMinutes === null) return null;
    return checkAvailability(room, startMin, endMin, currentMinutes, SAMPLE_BOOKINGS);
  }, [room, startMin, endMin, currentMinutes]);

  // Input for the optional explanation; the decision above stays authoritative.
  const explainInput: ExplainInput | null = useMemo(() => {
    if (!decision || startMin === null || endMin === null) return null;
    return {
      roomLabel: room?.name ?? "No room selected",
      start: minutesToLabel(startMin),
      end: minutesToLabel(endMin),
      isAvailable: decision.status === "available",
      reasonCode: decision.code,
    };
  }, [decision, room, startMin, endMin]);

  const duration =
    startMin !== null && endMin !== null && endMin > startMin
      ? durationLabel(startMin, endMin)
      : null;

  const { startInvalid, intervalInvalid, currentMissing } = getInputHints(startMin, endMin, currentMinutes);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Smart Campus Room Availability</h1>
            <p className="text-xs text-slate-500">Check whether a campus room is free for your time slot.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Room selection */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            1. Choose a room
          </h2>
          <RoomSelector rooms={SAMPLE_ROOMS} selectedId={roomId} onSelect={setRoomId} />
        </section>

        {/* Time inputs */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            2. Enter your time interval
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="current">
                Current time
              </label>
              <input
                id="current"
                type="time"
                value={currentLabel}
                onChange={(e) => setCurrentLabel(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  currentMissing
                    ? "border-rose-300 focus:ring-rose-200"
                    : "border-slate-300 focus:ring-teal-200"
                }`}
              />
              {currentMissing && (
                <p className="mt-1 text-xs text-rose-600">Enter the current time.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="start">
                Start time
              </label>
              <input
                id="start"
                type="time"
                value={startLabel}
                onChange={(e) => setStartLabel(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  startInvalid
                    ? "border-rose-300 focus:ring-rose-200"
                    : "border-slate-300 focus:ring-teal-200"
                }`}
              />
              {startInvalid && (
                <p className="mt-1 text-xs text-rose-600">
                  Must be after current time ({currentLabel}).
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="end">
                End time
              </label>
              <input
                id="end"
                type="time"
                value={endLabel}
                onChange={(e) => setEndLabel(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  intervalInvalid
                    ? "border-rose-300 focus:ring-rose-200"
                    : "border-slate-300 focus:ring-teal-200"
                }`}
              />
              {intervalInvalid && (
                <p className="mt-1 text-xs text-rose-600">End must be after start.</p>
              )}
            </div>
            <div className="flex flex-col justify-end">
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Duration: <span className="font-semibold">{duration ?? "—"}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            3. Visual schedule
          </h2>
          <Timeline
            room={room}
            bookings={SAMPLE_BOOKINGS}
            candidateStart={startMin}
            candidateEnd={endMin}
          />
        </section>

        {/* Result */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            4. Availability check
          </h2>
          <ResultPanel decision={decision} />
          {explainInput && <ExplainPanel input={explainInput} />}
        </section>

        {/* Bookings list (read-only context) */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Existing bookings {room ? `for ${room.name}` : ""}
          </h2>
          {room && SAMPLE_BOOKINGS.filter((b) => b.roomId === room.id).length === 0 ? (
            <p className="text-sm text-slate-400">No existing bookings for this room.</p>
          ) : (
            <ul className="space-y-2">
              {SAMPLE_BOOKINGS
                .filter((b) => b.roomId === roomId)
                .sort((a, b) => a.start - b.start)
                .map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-700">{b.title}</span>
                    <span className="text-slate-500">
                      {minutesToLabel(b.start)} – {minutesToLabel(b.end)}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <footer className="pb-6 pt-2 text-center text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Search className="h-3 w-3" /> Read-only checker — no bookings are created or modified.
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
