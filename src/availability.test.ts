import { describe, it, expect } from "vitest";
import { checkAvailability, getInputHints } from "@/availability";
import { SAMPLE_BOOKINGS, SAMPLE_ROOMS } from "@/sampleData";
import { labelToMinutes } from "@/timeUtils";
import type { Booking, Room } from "@/types";

// Fixed "current time" (09:00); the function receives it as an argument and never reads the clock.
const NOW = 540;

// Fresh fixtures for every test.
const makeRoom = (overrides: Partial<Room> = {}): Room => ({
  id: "r1",
  name: "Test Room",
  building: "X",
  capacity: 10,
  blocked: false,
  ...overrides,
});

const makeBookings = (): Booking[] => [
  { id: "b1", roomId: "r1", start: 600, end: 660, title: "Existing" },
];

interface Case {
  id: string;
  ac: string;
  start: number;
  end: number;
  expected: "available" | "unavailable";
  blocked?: boolean;
  bookings?: () => Booking[];
}

// T01–T14: reviewed case table. T15–T18: own justified cases.
const cases: Case[] = [
  { id: "T01 660-720 touching after", ac: "AC4", start: 660, end: 720, expected: "available" },
  { id: "T02 540-570 starts now", ac: "AC1", start: 540, end: 570, expected: "unavailable" },
  { id: "T03 720-720 zero duration", ac: "AC1", start: 720, end: 720, expected: "unavailable" },
  { id: "T04 750-720 reversed", ac: "AC1", start: 750, end: 720, expected: "unavailable" },
  { id: "T05 1380-1441 past day end", ac: "AC1", start: 1380, end: 1441, expected: "unavailable" },
  { id: "T06 720-840 exactly 120 min", ac: "AC2", start: 720, end: 840, expected: "available" },
  { id: "T07 720-841 121 min", ac: "AC2", start: 720, end: 841, expected: "unavailable" },
  { id: "T08 570-600 touching before", ac: "AC4", start: 570, end: 600, expected: "available" },
  { id: "T09 630-690 partial overlap", ac: "AC4", start: 630, end: 690, expected: "unavailable" },
  { id: "T10 570-690 contains booking", ac: "AC4", start: 570, end: 690, expected: "unavailable" },
  { id: "T11 615-645 inside booking", ac: "AC4", start: 615, end: 645, expected: "unavailable" },
  { id: "T12 600-660 identical interval", ac: "AC4", start: 600, end: 660, expected: "unavailable" },
  { id: "T13 660-720 room blocked", ac: "AC3", start: 660, end: 720, expected: "unavailable", blocked: true },
  { id: "T14 630-690 no bookings", ac: "AC4", start: 630, end: 690, expected: "available", bookings: () => [] },
  // Own case: start one minute after now is the first accepted start (AC1 says "after", not "at or after").
  { id: "T15 541-571 one minute after now", ac: "AC1", start: 541, end: 571, expected: "available" },
  // Own case: AC1 allows end <= 1440, so ending exactly at midnight is valid.
  { id: "T16 1380-1440 ends at day end", ac: "AC1", start: 1380, end: 1440, expected: "available" },
  // Own case: a booking of another room must not block this room.
  {
    id: "T17 600-660 booking in another room",
    ac: "AC4",
    start: 600,
    end: 660,
    expected: "available",
    bookings: () => [{ id: "b2", roomId: "r2", start: 600, end: 660, title: "Other room" }],
  },
  // Own case: AC1 lower bound 0 <= start.
  { id: "T18 -10-30 negative start", ac: "AC1", start: -10, end: 30, expected: "unavailable" },
];

describe("checkAvailability: case table (AC1-AC4) with unchanged data (AC5)", () => {
  it.each(cases)("$id ($ac) -> $expected", (c) => {
    // Arrange
    const room = makeRoom({ blocked: c.blocked ?? false });
    const bookings = c.bookings ? c.bookings() : makeBookings();
    const before = structuredClone(bookings);

    // Act
    const result = checkAvailability(room, c.start, c.end, NOW, bookings);

    // Assert: exact decision and unchanged booking data
    expect(result.status).toBe(c.expected);
    expect(bookings).toEqual(before);
  });
});

describe("AC5: decision does not change booking data", () => {
  it("T19 an Available decision does not save the candidate, and repeated checks give the same result", () => {
    const bookings = makeBookings();

    const first = checkAvailability(makeRoom(), 660, 720, NOW, bookings);
    const second = checkAvailability(makeRoom(), 660, 720, NOW, bookings);

    expect(first.status).toBe("available");
    expect(second).toEqual(first);
    expect(bookings).toEqual(makeBookings());
    expect(bookings).toHaveLength(1);
  });
});

describe("Integration: page data and time parsing with the real booking logic", () => {
  it("T20 Boreal Lab sample data: 11:00-12:00 available, 10:30-11:30 overlaps; blocked Cedar Suite rejected", () => {
    const now = labelToMinutes("09:00")!;
    const boreal = SAMPLE_ROOMS.find((r) => r.id === "r2")!;
    const cedar = SAMPLE_ROOMS.find((r) => r.id === "r3")!;
    const before = structuredClone(SAMPLE_BOOKINGS);

    const free = checkAvailability(boreal, labelToMinutes("11:00")!, labelToMinutes("12:00")!, now, SAMPLE_BOOKINGS);
    const busy = checkAvailability(boreal, labelToMinutes("10:30")!, labelToMinutes("11:30")!, now, SAMPLE_BOOKINGS);
    const blocked = checkAvailability(cedar, labelToMinutes("11:00")!, labelToMinutes("12:00")!, now, SAMPLE_BOOKINGS);

    expect(free.status).toBe("available");
    expect(busy.status).toBe("unavailable");
    expect(blocked.status).toBe("unavailable");
    expect(SAMPLE_BOOKINGS).toEqual(before);
  });
});

describe("getInputHints: AC1 inline hints agree with checkAvailability (AC6 feedback)", () => {
  it("T22 start at or before now is flagged (AC1: start must be after current time); start after now is not", () => {
    expect(getInputHints(NOW, NOW + 30, NOW).startInvalid).toBe(true);
    expect(getInputHints(NOW - 10, NOW + 30, NOW).startInvalid).toBe(true);
    expect(getInputHints(NOW + 1, NOW + 31, NOW).startInvalid).toBe(false);
  });

  it("T23 reversed or zero-length interval is flagged (AC1: start < end); a valid interval is not", () => {
    expect(getInputHints(750, 720, NOW).intervalInvalid).toBe(true);
    expect(getInputHints(720, 720, NOW).intervalInvalid).toBe(true);
    expect(getInputHints(720, 721, NOW).intervalInvalid).toBe(false);
  });

  it("T24 an unparsed (null) field shows no hint, as before the refactoring", () => {
    expect(getInputHints(null, 720, NOW)).toEqual({ startInvalid: false, intervalInvalid: false, currentMissing: false });
    expect(getInputHints(720, null, NOW).intervalInvalid).toBe(false);
    expect(getInputHints(null, null, NOW)).toEqual({ startInvalid: false, intervalInvalid: false, currentMissing: false });
  });

  it("T25 a hint is raised exactly when checkAvailability rejects for the same AC1 reason", () => {
    const room = makeRoom();
    const pairs: Array<[number, number]> = [[NOW, NOW + 30], [541, 571], [750, 720], [720, 720], [720, 840]];
    for (const [start, end] of pairs) {
      const hints = getInputHints(start, end, NOW);
      const decision = checkAvailability(room, start, end, NOW, []);
      expect(hints.startInvalid || hints.intervalInvalid).toBe(decision.status === "unavailable");
    }
  });
});

describe("getInputHints: R1 missing current time (AC1/AC6)", () => {
  it("T26 a null current time sets currentMissing and does not flag startInvalid", () => {
    const hints = getInputHints(480, 540, null);
    expect(hints.currentMissing).toBe(true);
    expect(hints.startInvalid).toBe(false);
    expect(getInputHints(null, null, null).currentMissing).toBe(true);
    expect(getInputHints(750, 720, null).intervalInvalid).toBe(true);
  });

  it("T27 a valid current time gives currentMissing false and unchanged start/interval results", () => {
    expect(getInputHints(NOW, NOW + 30, NOW)).toEqual({ currentMissing: false, startInvalid: true, intervalInvalid: false });
    expect(getInputHints(NOW + 1, NOW + 31, NOW)).toEqual({ currentMissing: false, startInvalid: false, intervalInvalid: false });
    expect(getInputHints(750, 720, NOW)).toEqual({ currentMissing: false, startInvalid: false, intervalInvalid: true });
  });
});

describe("Regression (Practice #09)", () => {
  it("T21 BUG-B: an unsorted bookings array keeps its order, content and object references (AC5)", () => {
    const room = makeRoom();
    const bookings: Booking[] = [
      { id: "late", roomId: "r1", start: 600, end: 660, title: "Late" },
      { id: "early", roomId: "r1", start: 480, end: 540, title: "Early" },
      { id: "other", roomId: "r2", start: 500, end: 520, title: "Other room" },
    ];
    const before = structuredClone(bookings);
    const refs = [...bookings];

    expect(checkAvailability(room, 700, 760, NOW, bookings).status).toBe("available");
    expect(checkAvailability(room, 590, 650, NOW, bookings).status).toBe("unavailable");

    expect(bookings).toEqual(before);
    bookings.forEach((b, i) => expect(b).toBe(refs[i]));
  });
});
