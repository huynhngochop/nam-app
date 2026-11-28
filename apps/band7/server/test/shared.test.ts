// Chạy: node --experimental-strip-types --test test/shared.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRepair, keyPhraseOf, normalize } from "../supabase/functions/_shared/text.ts";
import { buildExaminerMessages, parseExaminerOutput } from "../supabase/functions/_shared/examiner.ts";

test("normalize expands contractions and drops IPA", () => {
  assert.deepEqual(normalize("It's changed! /θɪŋk/"), ["it", "is", "changed"]);
});

test("keyPhraseOf finds the corrected part", () => {
  assert.equal(keyPhraseOf("My city change a lot", "My city has changed a lot"), "has changed");
  assert.equal(keyPhraseOf("do a decision", "make a decision"), "make");
});

test("checkRepair passes a correct re-say even with contraction", () => {
  const r = checkRepair("my city's changed a lot", "My city has changed a lot", "has changed");
  // "city's" → không phải "has": phải nói rõ cụm then chốt
  assert.equal(r.keyHit, false);
  const ok = checkRepair("My city has changed a lot.", "My city has changed a lot", "has changed");
  assert.equal(ok.ok, true);
  assert.equal(ok.similarity, 1);
});

test("checkRepair fails when the key phrase is missing", () => {
  const r = checkRepair("My city change a lot", "My city has changed a lot", "has changed");
  assert.equal(r.ok, false);
  assert.deepEqual(r.missed, ["has", "changed"]);
});

test("checkRepair tolerates one small slip in a long sentence", () => {
  const r = checkRepair("High rise buildings have sprung up everywhere in the city",
    "High-rise buildings have sprung up everywhere in my city", "have sprung up");
  assert.equal(r.ok, true);
});

const due = [{ id: "e1", code: "VN-07", right_text: "has changed", elicit_hint: "Ask how something changed" }];
const codes = [{ code: "VN-07", category: "GRA" as const, title: "present perfect" }];

test("prompt contains hidden-recall instruction and due target", () => {
  const msgs = buildExaminerMessages({
    part: 1, topic: "Hometown", mode: "practice", correctionLevel: "medium", estimatedBand: 5.5,
    history: [{ role: "examiner", text: "Where are you from?" }], learnerText: "I from Hue.",
    activeTarget: null, dueTargets: due, codes,
  });
  assert.match(msgs[0].content, /Never mention the structure/);
  assert.match(msgs[0].content, /id=e1/);
  assert.match(msgs[1].content, /Learner: I from Hue\./);
});

test("parser rejects invented ids/codes and caps errors", () => {
  const raw = '```json\n{"reply":"Has your city changed much?","target_id":"hacked","recall":"correct",' +
    '"errors":[{"code":"VN-99","cat":"GRA","wrong":"I from Hue","right":"I am from Hue","vi":"Thiếu be"},' +
    '{"code":"VN-07","cat":"XX","wrong":"a","right":"b"},{"cat":"LR","wrong":"same","right":"same"},' +
    '{"code":"VN-07","cat":"GRA","wrong":"x","right":"y"},{"code":"VN-07","cat":"GRA","wrong":"x2","right":"y2"}]}\n```';
  const out = parseExaminerOutput(raw, { dueIds: ["e1"], knownCodes: ["VN-07"], maxErrors: 2, hadActiveTarget: false });
  assert.equal(out.targetId, null);
  assert.equal(out.recall, "none");                 // không có mục đang gài → bỏ qua
  assert.equal(out.errors.length, 2);
  assert.equal(out.errors[0].code, null);           // VN-99 không tồn tại
  assert.equal(out.errors[1].code, "VN-07");
});

test("parser survives non-JSON output", () => {
  const out = parseExaminerOutput("Sure! What do you like about Hue?", { dueIds: [], knownCodes: [], maxErrors: 2, hadActiveTarget: true });
  assert.equal(out.reply, "Sure! What do you like about Hue?");
  assert.equal(out.errors.length, 0);
});

test("upgrade sentence aims about one band higher, capped by target and 9.0", async () => {
  const { upgradeBand } = await import("../supabase/functions/_shared/examiner.ts");
  assert.equal(upgradeBand(5, 9), 6);
  assert.equal(upgradeBand(6.5, 7), 7);
  assert.equal(upgradeBand(8.5, 9), 9);
  assert.equal(upgradeBand(9, 9), 9);
  assert.equal(upgradeBand(6), 7);
});

test("prompt adapts strictness and upgrade band to the target", () => {
  const base = {
    part: 3 as const, topic: "Cities", mode: "practice" as const, correctionLevel: "medium" as const,
    history: [], learnerText: "I think city is more better.", activeTarget: null, dueTargets: [], codes: [],
  };
  const high = buildExaminerMessages({ ...base, estimatedBand: 7.5, targetBand: 9 })[0].content;
  assert.match(high, /aims for band 9\.0/);
  assert.match(high, /flag even small slips/);
  assert.match(high, /rewritten at band 8\.5/);
  const low = buildExaminerMessages({ ...base, estimatedBand: 5, targetBand: 6 })[0].content;
  assert.match(low, /ignore tiny slips/);
  assert.match(low, /rewritten at band 6\.0/);
});

test("parser reads the upgrade sentence (and the old band7 key)", () => {
  const opts = { dueIds: [], knownCodes: [], maxErrors: 2, hadActiveTarget: false };
  const a = parseExaminerOutput('{"reply":"Why?","errors":[{"cat":"GRA","wrong":"more better","right":"better","upgrade":"Cities are far better."}]}', opts);
  assert.equal(a.errors[0].band7, "Cities are far better.");
  const b = parseExaminerOutput('{"reply":"Why?","errors":[{"cat":"GRA","wrong":"more better","right":"better","band7":"Old key."}]}', opts);
  assert.equal(b.errors[0].band7, "Old key.");
});
