import assert from "node:assert/strict";
import test from "node:test";
import { can, createShareToken, getRoleLabel } from "./permissions.js";

test("role permissions distinguish editor and viewer", () => {
  assert.equal(can("editor", "edit"), true);
  assert.equal(can("viewer", "edit"), false);
  assert.equal(can("viewer", "read"), true);
});

test("role labels are user-facing", () => {
  assert.equal(getRoleLabel("commenter"), "Commenter");
  assert.equal(getRoleLabel("unknown"), "Viewer");
});

test("share tokens include file and role", () => {
  const token = createShareToken("file-1", "viewer");

  assert.match(token, /^file-1\.viewer\./);
});
