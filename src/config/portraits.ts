import type { AllyId } from "../types";

export const ALLY_PORTRAITS: Record<AllyId, string> = {
  A01: "portrait-A01",
  A02: "portrait-A02",
  A03: "portrait-A03",
  A04: "portrait-A04",
  A05: "portrait-A05",
  A06: "portrait-A06",
  A07: "portrait-A07",
  A08: "portrait-A08",
  A09: "portrait-A09",
  A10: "portrait-A10",
};

export function getAllyPortrait(id: AllyId): string {
  return ALLY_PORTRAITS[id];
}
