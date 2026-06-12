import assert from "node:assert/strict";
import test from "node:test";
import { diagramLayout, parseDiagramDsl, quickFixDiagramDsl } from "./diagram.js";

test("parseDiagramDsl extracts nodes and labeled edges", () => {
  const result = parseDiagramDsl(`diagram flowchart
Client -> API: login
API -> DB: lookup`);

  assert.equal(result.type, "flowchart");
  assert.equal(result.nodes.length, 3);
  assert.equal(result.edges.length, 2);
  assert.equal(result.edges[0].label, "login");
  assert.deepEqual(result.diagnostics, []);
});

test("parseDiagramDsl reports invalid lines", () => {
  const result = parseDiagramDsl(`diagram erd
User owns Workspace`);

  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].line, 2);
});

test("quickFixDiagramDsl converts common arrow typos", () => {
  assert.equal(quickFixDiagramDsl("Client => API"), "Client -> API");
  assert.equal(quickFixDiagramDsl("Client, API"), "Client -> API: relates");
});

test("diagramLayout keeps nodes inside the viewport", () => {
  const result = parseDiagramDsl(`diagram system
A -> B
B -> C
C -> D`);
  const layout = diagramLayout(result.nodes);

  assert.ok(layout.every((node) => node.x >= 60));
  assert.ok(layout.every((node) => node.x + node.width <= 700));
});
