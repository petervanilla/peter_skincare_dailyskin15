import assert from "node:assert/strict";
import test from "node:test";
import { isReminderDue, todayKey } from "./reminder.ts";

// Saturday 2026-09-19 21:30 local.
const SAT_NIGHT = new Date(2026, 8, 19, 21, 30);
const base = { reminderEnabled: true, reminderTime: "21:00", reminderDays: [0, 1, 2, 3, 4, 5, 6] };

test("due after the reminder time with no capture today", () => {
  assert.equal(isReminderDue(base, [], SAT_NIGHT), true);
});

test("not due before the reminder time", () => {
  assert.equal(isReminderDue(base, [], new Date(2026, 8, 19, 20, 59)), false);
});

test("not due when disabled", () => {
  assert.equal(isReminderDue({ ...base, reminderEnabled: false }, [], SAT_NIGHT), false);
});

test("not due on a weekday outside the schedule", () => {
  // Saturday is 6; schedule Mon–Fri only.
  assert.equal(isReminderDue({ ...base, reminderDays: [1, 2, 3, 4, 5] }, [], SAT_NIGHT), false);
});

test("not due once today's capture exists", () => {
  assert.equal(isReminderDue(base, [{ date: todayKey(SAT_NIGHT) }], SAT_NIGHT), false);
  assert.equal(isReminderDue(base, [{ date: "2026-09-18" }], SAT_NIGHT), true);
});

test("malformed time never fires", () => {
  assert.equal(isReminderDue({ ...base, reminderTime: "abc" }, [], SAT_NIGHT), false);
});
