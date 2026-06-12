import assert from "node:assert/strict";
import test from "node:test";
import { cancelExportJob, createExportJob, getExportJob } from "./export.service.js";

test("createExportJob stores completed job metadata", () => {
  const job = createExportJob("SVG", "auth-architecture");

  assert.equal(job.format, "SVG");
  assert.equal(job.status, "complete");
  assert.equal(getExportJob(job.id)?.id, job.id);
});

test("cancelExportJob marks existing jobs as cancelled", () => {
  const job = createExportJob("PDF", "auth-architecture");
  const cancelled = cancelExportJob(job.id);

  assert.equal(cancelled?.status, "cancelled");
});
