import {
  apiKeys,
  comments,
  files,
  folders,
  integrations,
  plans,
  teamMembers,
  templates,
  usage,
  versions,
  workspace,
  type FileRecord
} from "../data/mock-data.js";

const mutableFiles = new Map(files.map((file) => [file.id, { ...file }]));
const mutableComments = [...comments];
const mutableVersions = [...versions];
const mutableApiKeys = [...apiKeys];

export function getBootstrapData() {
  return {
    workspace,
    files: [...mutableFiles.values()],
    folders,
    templates,
    teamMembers,
    comments: mutableComments,
    versions: mutableVersions,
    integrations,
    apiKeys: mutableApiKeys,
    plans,
    usage
  };
}

export function listFiles() {
  return [...mutableFiles.values()];
}

export function getFile(fileId: string) {
  return mutableFiles.get(fileId);
}

export function createFile(input: Pick<FileRecord, "title" | "kind" | "folder">) {
  const id = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const file: FileRecord = {
    id,
    title: input.title,
    folder: input.folder,
    kind: input.kind,
    owner: "Founder",
    updated: "Just now",
    status: "active",
    shared: false,
    markdown: "## New file",
    diagramDsl: "diagram flowchart\nClient -> API: request"
  };

  mutableFiles.set(id, file);
  return file;
}

export function updateFile(fileId: string, input: Partial<FileRecord>) {
  const current = mutableFiles.get(fileId);
  if (!current) return undefined;

  const next = {
    ...current,
    ...input,
    updated: "Just now"
  };

  mutableFiles.set(fileId, next);
  return next;
}

export function softDeleteFile(fileId: string) {
  return updateFile(fileId, { status: "trash" });
}

export function restoreFile(fileId: string) {
  return updateFile(fileId, { status: "active" });
}

export function addVersion(fileId: string, label: string, by = "Founder") {
  const version = {
    id: `v${mutableVersions.length + 1}`,
    fileId,
    label,
    by,
    time: "Just now"
  };

  mutableVersions.unshift(version);
  return version;
}

export function listVersions(fileId: string) {
  return mutableVersions.filter((version) => version.fileId === fileId);
}

export function addComment(fileId: string, input: { author?: string; target?: string; text: string }) {
  const comment = {
    id: `c${mutableComments.length + 1}`,
    fileId,
    author: input.author ?? "Founder",
    target: input.target ?? "File",
    text: input.text,
    status: "open"
  };

  mutableComments.unshift(comment);
  return comment;
}

export function resolveComment(commentId: string) {
  const comment = mutableComments.find((item) => item.id === commentId);
  if (!comment) return undefined;
  comment.status = "resolved";
  return comment;
}

export function listComments(fileId: string) {
  return mutableComments.filter((comment) => comment.fileId === fileId);
}

export function createApiKey(input: { name: string; scope: string }) {
  const key = {
    id: `key_${mutableApiKeys.length + 1}`,
    name: input.name,
    scope: input.scope,
    lastUsed: "Never",
    status: "active"
  };

  mutableApiKeys.push(key);
  return key;
}

export function revokeApiKey(keyId: string) {
  const key = mutableApiKeys.find((item) => item.id === keyId);
  if (!key) return undefined;
  key.status = "revoked";
  return key;
}
