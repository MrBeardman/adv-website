/* The inquiry chat (Honza, Nov 19 2026): the inquiry runs as a conversation with an AI assistant.
 *
 *   1. scripted: the visitor picks a service, then answers that service's questions from data/inquiry.ts
 *      (budget left out for now) with buttons or their own words; the last one is open.
 *   2. contact: name, e-mail, optional phone. The lead is stored and sent to Telegram right here, so it is
 *      never lost if the visitor leaves later.
 *   3. AI: Claude Haiku reads the answers and asks at most AI_TURNS follow-up questions about the real
 *      problem (lib/chatAgent.ts). The server counts the turns, not the model.
 *   4. a meeting: a free slot from lib/slots.ts. It is a request; the team confirms it.
 *
 * Persona, question types and slot rules live here so they can be tuned in one place. All visitor-facing
 * texts are in i18n/chat.json (NEW COPY for Honza's approval, docs/STATUS.md).
 */
import { FLOWS, type Question } from './inquiry';

/** The assistant's name in the chat header. Not a person's name (Honza, Nov 19). */
export const PERSONA = { name: 'ADV Pilot' };

/** Scripted questions left out of the chat. */
const SKIP = new Set(['budget']);
export const CHAT_FLOWS: Record<string, Question[]> = Object.fromEntries(
  Object.entries(FLOWS).map(([slug, qs]) => [slug, qs.filter((q) => !SKIP.has(q.id))]),
);

/** Follow-up questions the AI may ask, at most this many. */
export const AI_TURNS = 3;

/** The kinds of follow-up question the AI may ask. It picks one and words it for this visitor. */
export const QUESTION_TYPES = {
  problem: 'What exactly goes wrong today: the concrete situation where it hurts, with an example.',
  current_state: 'How it works today, step by step: who does what, in which tools, how the data moves.',
  impact: 'What it costs them: time, money, errors, lost customers, people. Rough numbers are fine.',
  trigger: 'Why now: what changed or happened that made them look for help.',
  goal: 'What a good result looks like for them, how they would know it worked.',
  constraints: 'What must stay as it is, or limits: systems they cannot change, rules, deadlines, data.',
  decision: 'Who else is involved in deciding or using it, and what they need to see.',
} as const;
export type QuestionType = keyof typeof QUESTION_TYPES;

/** Meeting slots (Honza, Nov 19 2026): 30 min video call, Mon-Fri 9-17 Prague time, 15 min between
 *  meetings, from 24 hours ahead up to 3 weeks ahead. Every booking waits for the team's confirmation. */
export const SLOTS = {
  zone: 'Europe/Prague',
  days: [1, 2, 3, 4, 5], // Monday..Friday
  from: 9 * 60, // minutes after midnight
  to: 17 * 60, // the last meeting ends by then
  length: 30,
  buffer: 15,
  noticeHours: 24,
  horizonDays: 21,
};
