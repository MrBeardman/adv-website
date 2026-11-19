/**
 * Free meeting slots for the inquiry chat (data/chat.ts SLOTS) and the booking store.
 *
 * A slot is free when it is a working day (Mon-Fri, not a Czech public holiday), inside working hours,
 * far enough ahead, and clear (with the buffer) of:
 *   - meetings already requested through the chat (bookings.jsonl, pending or confirmed), and
 *   - the team calendar, when N8N_BUSY_URL is set: an n8n webhook that answers
 *     { busy: [{ start, end }] } (ISO times) from the shared ADV Google calendar's free/busy.
 *     Asked with the X-ADV-Key header, cached for a few minutes; if it fails, slots are offered anyway
 *     (every booking waits for the team's confirmation).
 *
 * Times are computed in Europe/Prague and travel as ISO UTC strings.
 */
import { mkdir, appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { SLOTS } from '../data/chat';

const env = (k: string): string => (process.env[k] ?? import.meta.env[k] ?? '').trim();
const MIN = 60_000;

// ---- time zone helpers -------------------------------------------------------------------------------
const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: SLOTS.zone,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
});
function parts(ms: number) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return {
    y: +p.year,
    m: +p.month,
    d: +p.day,
    h: +p.hour,
    mi: +p.minute,
    s: +p.second,
    wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday),
  };
}
const offset = (ms: number) => {
  const p = parts(ms);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
};
/** A wall-clock time in Prague (minutes after midnight) to a UTC timestamp. */
function zoned(y: number, m: number, d: number, minutes: number) {
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  let ms = guess - offset(guess);
  ms = guess - offset(ms); // second pass across a DST change
  return ms;
}
const ymd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// ---- Czech public holidays ---------------------------------------------------------------------------
function easterSunday(y: number) {
  // Anonymous Gregorian algorithm
  const a = y % 19,
    b = Math.floor(y / 100),
    c = y % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31),
    day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(y, month - 1, day);
}
const holidayCache = new Map<number, Set<string>>();
function holidays(y: number) {
  let set = holidayCache.get(y);
  if (set) return set;
  const fixed = ['01-01', '05-01', '05-08', '07-05', '07-06', '09-28', '10-28', '11-17', '12-24', '12-25', '12-26'];
  set = new Set(fixed.map((md) => `${y}-${md}`));
  const easter = easterSunday(y);
  for (const shift of [-2, 1]) set.add(new Date(easter + shift * 86_400_000).toISOString().slice(0, 10));
  holidayCache.set(y, set);
  return set;
}

// ---- bookings store ----------------------------------------------------------------------------------
export interface Booking {
  id: string;
  sid: string;
  at: string;
  start: string;
  end: string;
  status: 'pending' | 'confirmed' | 'declined';
  name: string;
  email: string;
}
const dir = () => env('SUBMISSIONS_DIR') || path.join(process.cwd(), 'data', 'submissions');
const bookingsFile = () => path.join(dir(), 'bookings.jsonl');
let bookings: Booking[] | null = null;
async function loadBookings() {
  if (bookings) return bookings;
  try {
    const raw = await readFile(bookingsFile(), 'utf8');
    bookings = raw
      .split('\n')
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l) as Booking;
        } catch {
          return null;
        }
      })
      .filter((b): b is Booking => !!b && !!b.start);
  } catch {
    bookings = [];
  }
  return bookings;
}
export async function saveBooking(b: Booking) {
  const list = await loadBookings();
  await mkdir(dir(), { recursive: true });
  await appendFile(bookingsFile(), JSON.stringify(b) + '\n');
  list.push(b);
}

// ---- the team calendar (optional) --------------------------------------------------------------------
let busyCache: { at: number; busy: { start: number; end: number }[] } | null = null;
async function calendarBusy() {
  const url = env('N8N_BUSY_URL');
  if (!url) return [];
  if (busyCache && Date.now() - busyCache.at < 5 * MIN) return busyCache.busy;
  try {
    const res = await fetch(url, {
      headers: { 'X-ADV-Key': env('N8N_INQUIRY_KEY') },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const body = (await res.json()) as { busy?: { start: string; end: string }[] };
    const busy = (body.busy ?? [])
      .map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }))
      .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end) && b.end > b.start);
    busyCache = { at: Date.now(), busy };
    return busy;
  } catch (e) {
    console.error('[slots] calendar busy feed failed', e);
    return busyCache?.busy ?? [];
  }
}

// ---- slots -------------------------------------------------------------------------------------------
export interface Day {
  date: string; // YYYY-MM-DD in Prague
  slots: string[]; // ISO UTC starts
}

export async function freeSlots(now = Date.now()): Promise<Day[]> {
  const taken = (await loadBookings())
    .filter((b) => b.status !== 'declined')
    .map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
  const busy = [...taken, ...(await calendarBusy())];
  const earliest = now + SLOTS.noticeHours * 60 * MIN;
  const buf = SLOTS.buffer * MIN;
  const days: Day[] = [];
  const today = parts(now);
  for (let i = 0; i <= SLOTS.horizonDays; i++) {
    const noon = zoned(today.y, today.m, today.d, 12 * 60) + i * 86_400_000;
    const p = parts(noon);
    const date = ymd(p.y, p.m, p.d);
    if (!SLOTS.days.includes(p.wd) || holidays(p.y).has(date)) continue;
    const slots: string[] = [];
    for (let t = SLOTS.from; t + SLOTS.length <= SLOTS.to; t += SLOTS.length + SLOTS.buffer) {
      const start = zoned(p.y, p.m, p.d, t);
      const end = start + SLOTS.length * MIN;
      if (start < earliest) continue;
      if (busy.some((b) => start < b.end + buf && end > b.start - buf)) continue;
      slots.push(new Date(start).toISOString());
    }
    if (slots.length) days.push({ date, slots });
  }
  return days;
}

/** Is this start one of the free slots right now? (the visitor may have waited on the picker) */
export async function isFree(startIso: string) {
  const days = await freeSlots();
  return days.some((d) => d.slots.includes(startIso));
}
export const slotEnd = (startIso: string) => new Date(Date.parse(startIso) + SLOTS.length * MIN).toISOString();
