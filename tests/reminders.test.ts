import test from "node:test";
import assert from "node:assert/strict";
import { parseReminderOffsets, shouldMarkOverdue, shouldSendDueReminder } from "../lib/scheduler/rules.ts";

test("parseReminderOffsets parses comma separated integers", () => {
  assert.deepEqual(parseReminderOffsets("5, 3,1"), [5, 3, 1]);
});

test("shouldSendDueReminder returns true for configured day", () => {
  assert.equal(shouldSendDueReminder(3, [5, 3, 1]), true);
  assert.equal(shouldSendDueReminder(2, [5, 3, 1]), false);
});

test("shouldMarkOverdue ignores completed tasks", () => {
  assert.equal(shouldMarkOverdue(-1, "pending"), true);
  assert.equal(shouldMarkOverdue(-2, "completed"), false);
});

test("shouldSendDueReminder ignores overdue tasks", () => {
  assert.equal(shouldSendDueReminder(-1, [3, 1, 0]), false);
});
