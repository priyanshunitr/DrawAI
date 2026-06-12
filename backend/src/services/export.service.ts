const jobs = new Map<string, { id: string; format: string; status: string; progress: number; url?: string }>();

export function createExportJob(format: string, fileId: string) {
  const id = `exp_${Date.now()}`;
  const job = {
    id,
    format,
    status: "complete",
    progress: 100,
    url: `/api/v1/exports/${id}/download?fileId=${fileId}`
  };

  jobs.set(id, job);
  return job;
}

export function getExportJob(jobId: string) {
  return jobs.get(jobId);
}

export function cancelExportJob(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return undefined;
  const next = { ...job, status: "cancelled", progress: job.progress };
  jobs.set(jobId, next);
  return next;
}
