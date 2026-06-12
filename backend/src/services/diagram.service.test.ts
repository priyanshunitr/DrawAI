import assert from "node:assert/strict";
import test from "node:test";
import { layoutDiagram, parseDiagramDsl, quickFixDiagramDsl } from "./diagram.service.js";

test("parseDiagramDsl returns AST-like nodes, edges, and diagnostics", () => {
  const result = parseDiagramDsl(`diagram flowchart
Client -> API: login
API -> DB: lookup`);

  assert.equal(result.type, "flowchart");
  assert.equal(result.nodes.length, 3);
  assert.equal(result.edges.length, 2);
  assert.equal(result.diagnostics.length, 0);
});

test("parseDiagramDsl reports invalid syntax", () => {
  const result = parseDiagramDsl(`diagram erd
User owns Workspace`);

  assert.equal(result.diagnostics.length, 1);
});

test("layoutDiagram creates renderer payload", () => {
  const result = layoutDiagram(`diagram system
A -> B
B -> C`);

  assert.equal(result.layout.nodes.length, 3);
  assert.ok(result.layout.nodes.every((node) => typeof node.x === "number"));
});

test("quickFixDiagramDsl fixes common source mistakes", () => {
  assert.equal(quickFixDiagramDsl("A => B"), "A -> B");
  assert.equal(quickFixDiagramDsl("A, B"), "A -> B: relates");
});
