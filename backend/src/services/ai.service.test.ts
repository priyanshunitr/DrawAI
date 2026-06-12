import assert from "node:assert/strict";
import test from "node:test";
import { editDiagram, estimateCredits, explainDiagram, generateDiagram } from "./ai.service.js";

test("generateDiagram returns a reviewable diagram draft", () => {
  const result = generateDiagram({ prompt: "Auth system", diagramType: "architecture" });

  assert.equal(result.status, "review");
  assert.match(result.diagramDsl, /^diagram architecture/);
  assert.ok(result.credits >= 4);
});

test("editDiagram appends requested action context", () => {
  const result = editDiagram({ source: "diagram flowchart\nA -> B", action: "Add audit log" });

  assert.match(result.diagramDsl, /Audit log/);
});

test("explainDiagram counts relationships", () => {
  const result = explainDiagram("A -> B\nB -> C");

  assert.match(result.summary, /2 directed relationships/);
});

test("estimateCredits scales with action type and length", () => {
  assert.ok(estimateCredits("x".repeat(500), "generate") > estimateCredits("short", "edit"));
});
