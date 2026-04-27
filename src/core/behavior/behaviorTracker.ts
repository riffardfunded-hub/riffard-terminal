import { kvGet, kvSet } from "../storage/kv";
import type { BehaviorEvent, BehaviorSnapshot } from "./types";

const KEY = "riffard:behavior:v1";

export async function pushEvent(ev: BehaviorEvent): Promise<void> {
  const snap = await kvGet<BehaviorSnapshot>(KEY, { events: [] });
  snap.events.push(ev);
  await kvSet(KEY, snap);
}

export async function loadBehavior(): Promise<BehaviorSnapshot> {
  return kvGet(KEY, { events: [] });
}
