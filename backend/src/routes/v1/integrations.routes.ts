import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { folders, integrations } from "../../data/mock-data.js";
import { editDiagram, explainDiagram, generateDiagram } from "../../services/ai.service.js";
import {
  getDiagramExamples,
  layoutDiagram,
  parseDiagramDsl,
  quickFixDiagramDsl
} from "../../services/diagram.service.js";
import { cancelExportJob, createExportJob, getExportJob } from "../../services/export.service.js";
import {
  addComment,
  addVersion,
  createApiKey,
  createFile,
  getBootstrapData,
  getFile,
  listComments,
  listFiles,
  listVersions,
  resolveComment,
  restoreFile,
  revokeApiKey,
  softDeleteFile,
  updateFile
} from "../../services/workspace.service.js";

export const integrationsRouter = Router();

type ToolArguments = Record<string, unknown>;

type McpTool = {
  name: string;
  title: string;
  category: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

type TeamRecord = {
  id: string;
  name: string;
  slug: string;
  isDefault?: boolean;
};

type DiagramRecord = {
  id: string;
  fileId: string;
  title: string;
  source: string;
  diagramType: string;
  createdAt: number;
  updatedAt: number;
};

type PresetRecord = {
  id: string;
  name: string;
  description: string;
  rules: string;
  isDefault: boolean;
};

type FolderRecord = (typeof folders)[number] & { parentFolderId?: string | null };
type SortDirection = "asc" | "desc";
type McpPagination = {
  total: number;
  limit: number;
  offset: number;
  cursor: number;
  nextCursor: number | null;
};

const emptyInputSchema = {
  type: "object",
  properties: {},
  additionalProperties: false
};

const supportedDiagramTypes = [
  "freeform-diagram",
  "flowchart-diagram",
  "sequence-diagram",
  "entity-relationship-diagram",
  "cloud-architecture-diagram",
  "bpmn-diagram",
  "custom-diagram"
];

const teamDirectory: TeamRecord[] = [
  { id: "team-default", name: "DrawAI Product", slug: "drawai-product", isDefault: true },
  { id: "team-lab", name: "MCP Lab", slug: "mcp-lab" }
];
let selectedTeamId = teamDirectory[0]?.id ?? "team-default";
const mutableFolders: FolderRecord[] = [...folders];
const mutableFileMetadata = new Map<string, { createdAt: number; updatedAt: number; author: string }>();
const diagramStore = new Map<string, DiagramRecord>();
const fileDiagramIndex = new Map<string, string[]>();
const mutablePresets = new Map<string, PresetRecord>([
  ["preset-default", { id: "preset-default", name: "Balanced", description: "Balanced diagram styling", rules: "style: balanced", isDefault: true }],
  ["preset-clean", { id: "preset-clean", name: "Clean", description: "Minimal, high-contrast visual style", rules: "style: clean", isDefault: false }]
]);
const meResource = {
  id: "user-001",
  email: "founder@drawai.local",
  name: "Founder",
  activeTeamId: selectedTeamId
};
const supportedDiagramTypeMap = new Map<string, string>([
  ["freeform", "freeform-diagram"],
  ["freeform-diagram", "freeform-diagram"],
  ["flowchart", "flowchart-diagram"],
  ["flowchart-diagram", "flowchart-diagram"],
  ["sequence", "sequence-diagram"],
  ["sequence-diagram", "sequence-diagram"],
  ["entity-relationship", "entity-relationship-diagram"],
  ["entity-relationship-diagram", "entity-relationship-diagram"],
  ["cloud-architecture", "cloud-architecture-diagram"],
  ["cloud-architecture-diagram", "cloud-architecture-diagram"],
  ["bpmn", "bpmn-diagram"],
  ["bpmn-diagram", "bpmn-diagram"],
  ["custom", "custom-diagram"],
  ["custom-diagram", "custom-diagram"],
  ["architecture", "cloud-architecture-diagram"]
]);
const supportedImageFormats = new Set(["png", "jpeg"]);
const linkAccessModes = ["no-link-access", "anyone-with-link-can-edit", "publicly-viewable", "publicly-editable", "sso-readable", "sso-editable"] as const;
const diagramSortKeys = new Set(["createdAt", "updatedAt", "title"]);

const mcpTools: McpTool[] = [
  {
    name: "workspace.bootstrap",
    title: "Bootstrap workspace",
    category: "workspace",
    description: "Read the current workspace, files, folders, templates, members, usage, and plans.",
    inputSchema: emptyInputSchema
  },
  {
    name: "selectTeam",
    title: "Select team",
    category: "workspace",
    description: "Select the active workspace team for subsequent operations.",
    inputSchema: objectSchema({ teamId: { type: "string" }, teamName: { type: "string" } }, [])
  },
  {
    name: "get",
    title: "Get resource",
    category: "resource",
    description: "Read a file, diagram, folder, preset, or profile by id.",
    inputSchema: objectSchema({
      resource: { type: "string" },
      fileId: { type: "string" },
      diagramId: { type: "string" },
      folderId: { type: "string" },
      presetId: { type: "string" },
      id: { type: "string" },
      teamId: { type: "string" },
      recursive: { type: "boolean" }
    }, ["resource"])
  },
  {
    name: "list",
    title: "List resources",
    category: "resource",
    description: "List files, folders, presets, diagrams, or teams.",
    inputSchema: objectSchema({
      resource: { type: "string" },
      query: { type: "string" },
      folderId: { type: "string" },
      parentFolderId: { type: "string" },
      author: { type: "string" },
      sort: { type: "string" },
      limit: { type: "number" },
      cursor: { type: "number" },
      offset: { type: "number" },
      recursive: { type: "boolean" }
    }, ["resource"])
  },
  {
    name: "create",
    title: "Create resource",
    category: "resource",
    description: "Create a file, folder, or preset.",
    inputSchema: objectSchema({
      resource: { type: "string" },
      title: { type: "string" },
      name: { type: "string" },
      fileId: { type: "string" },
      text: { type: "string" },
      document: { type: "string" },
      code: { type: "string" },
      diagram: { type: "string" },
      folder: { type: "string" },
      folderId: { type: "string" },
      diagramType: { type: "string" },
      targetFileId: { type: "string" },
      parentFolderId: { type: "string" },
      kind: { type: "string" },
      share: { type: "string" },
      linkAccess: { type: "string" },
      description: { type: "string" },
      isDefault: { type: "boolean" }
    }, ["resource"])
  },
  {
    name: "update",
    title: "Update resource",
    category: "resource",
    description: "Update a file, folder, preset, or diagram.",
    inputSchema: objectSchema({
      resource: { type: "string" },
      fileId: { type: "string" },
      diagramId: { type: "string" },
      folderId: { type: "string" },
      presetId: { type: "string" },
      id: { type: "string" },
      title: { type: "string" },
      text: { type: "string" },
      markdown: { type: "string" },
      document: { type: "string" },
      diagramDsl: { type: "string" },
      code: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      rules: { type: "string" },
      diagramType: { type: "string" },
      linkAccess: { type: "string" },
      folder: { type: "string" },
      parentFolderId: { type: "string" },
      isDefault: { type: "boolean" },
      targetFileId: { type: "string" }
    }, ["resource"])
  },
  {
    name: "delete",
    title: "Delete resource",
    category: "resource",
    description: "Delete a file, diagram, folder, or preset.",
    inputSchema: objectSchema({
      resource: { type: "string" },
      fileId: { type: "string" },
      diagramId: { type: "string" },
      folderId: { type: "string" },
      presetId: { type: "string" },
      id: { type: "string" },
      recursive: { type: "boolean" }
    }, ["resource"])
  },
  {
    name: "search",
    title: "Search resources",
    category: "resource",
    description: "Search workspace files, folders, and diagrams by text.",
    inputSchema: objectSchema({
      query: { type: "string" },
      resource: { type: "string" },
      folderId: { type: "string" },
      limit: { type: "number" },
      offset: { type: "number" },
      cursor: { type: "number" }
    }, ["query"])
  },
  {
    name: "generate",
    title: "Generate diagram",
    category: "diagrams",
    description: "Generate a diagram from text and optionally save it to a file.",
    inputSchema: objectSchema({
      resource: { type: "string" },
      text: { type: "string" },
      prompt: { type: "string" },
      targetFileId: { type: "string" },
      fileId: { type: "string" },
      diagramId: { type: "string" },
      diagramType: { type: "string" },
      colorMode: { type: "string" },
      styleMode: { type: "string" },
      typeface: { type: "string" },
      direction: { type: "string" },
      theme: { type: "string" },
      format: { type: "string" },
      imageQuality: { type: "number" },
      background: { type: "boolean" },
      code: { type: "string" },
      output: { type: "string" },
      title: { type: "string" },
      folderId: { type: "string" },
      templateId: { type: "string" },
      presetId: { type: "string" },
      priorRequestId: { type: "string" },
      attachments: { type: "array", items: { type: "string" } },
      gitContexts: { type: "array", items: { type: "string" } }
    }, ["resource", "text"])
  },
  {
    name: "generateEdit",
    title: "Edit diagram",
    category: "diagrams",
    description: "Iteratively edit an existing diagram from a text prompt.",
    inputSchema: objectSchema({
      resource: { type: "string" },
      fileId: { type: "string" },
      diagramId: { type: "string" },
      text: { type: "string" },
      diagramType: { type: "string" },
      colorMode: { type: "string" },
      styleMode: { type: "string" },
      typeface: { type: "string" },
      direction: { type: "string" },
      theme: { type: "string" },
      format: { type: "string" },
      imageQuality: { type: "number" },
      background: { type: "boolean" },
      presetId: { type: "string" },
      templateId: { type: "string" },
      priorRequestId: { type: "string" },
      attachments: { type: "array", items: { type: "string" } },
      gitContexts: { type: "array", items: { type: "string" } }
    }, ["resource", "fileId", "text"])
  },
  {
    name: "export",
    title: "Export diagram",
    category: "exports",
    description: "Export a diagram and return a downloadable URL.",
    inputSchema: objectSchema({
      resource: { type: "string" },
      fileId: { type: "string" },
      diagramId: { type: "string" },
      format: { type: "string" },
      theme: { type: "string" },
      imageQuality: { type: "number" },
      background: { type: "boolean" }
    }, ["resource", "fileId", "diagramId"])
  },
  {
    name: "files.list",
    title: "List files",
    category: "files",
    description: "List all workspace files, including active and trashed files.",
    inputSchema: emptyInputSchema
  },
  {
    name: "files.read",
    title: "Read file",
    category: "files",
    description: "Read a file by id, or list files when no file id is supplied.",
    inputSchema: objectSchema({ fileId: { type: "string" } })
  },
  {
    name: "files.create",
    title: "Create file",
    category: "files",
    description: "Create a document or diagram file.",
    inputSchema: objectSchema({
      title: { type: "string" },
      kind: { type: "string", default: "Diagram" },
      folder: { type: "string", default: "Product" },
      markdown: { type: "string" },
      diagramDsl: { type: "string" }
    }, ["title"])
  },
  {
    name: "files.update",
    title: "Update file",
    category: "files",
    description: "Update file title, markdown, diagram DSL, or sharing state.",
    inputSchema: objectSchema({
      fileId: { type: "string" },
      title: { type: "string" },
      markdown: { type: "string" },
      diagramDsl: { type: "string" },
      shared: { type: "boolean" }
    }, ["fileId"])
  },
  {
    name: "files.delete",
    title: "Delete file",
    category: "files",
    description: "Move a file to trash.",
    inputSchema: objectSchema({ fileId: { type: "string" } }, ["fileId"])
  },
  {
    name: "files.restore",
    title: "Restore file",
    category: "files",
    description: "Restore a trashed file.",
    inputSchema: objectSchema({ fileId: { type: "string" } }, ["fileId"])
  },
  {
    name: "files.share",
    title: "Create share link",
    category: "files",
    description: "Create a share link for a file.",
    inputSchema: objectSchema({
      fileId: { type: "string" },
      role: { type: "string", enum: ["viewer", "commenter", "editor"], default: "viewer" },
      expiresAt: { type: "string" }
    }, ["fileId"])
  },
  {
    name: "diagrams.examples",
    title: "Diagram examples",
    category: "diagrams",
    description: "List diagram DSL examples.",
    inputSchema: emptyInputSchema
  },
  {
    name: "diagrams.parse",
    title: "Parse diagram",
    category: "diagrams",
    description: "Parse diagram DSL into nodes, edges, and diagnostics.",
    inputSchema: objectSchema({ source: { type: "string" } }, ["source"])
  },
  {
    name: "diagrams.layout",
    title: "Layout diagram",
    category: "diagrams",
    description: "Parse and layout diagram DSL.",
    inputSchema: objectSchema({ source: { type: "string" } }, ["source"])
  },
  {
    name: "diagrams.quickFix",
    title: "Quick fix diagram",
    category: "diagrams",
    description: "Repair common diagram DSL mistakes.",
    inputSchema: objectSchema({ source: { type: "string" } }, ["source"])
  },
  {
    name: "diagrams.convert",
    title: "Convert diagram",
    category: "diagrams",
    description: "Convert a diagram DSL header to a target diagram type.",
    inputSchema: objectSchema({ source: { type: "string" }, targetType: { type: "string" } }, ["source", "targetType"])
  },
  {
    name: "diagrams.create",
    title: "Create diagram",
    category: "diagrams",
    description: "Create a diagram file from DSL.",
    inputSchema: objectSchema({
      title: { type: "string" },
      source: { type: "string" },
      folder: { type: "string", default: "Product" },
      diagramType: { type: "string", default: "flowchart" }
    }, ["title"])
  },
  {
    name: "diagrams.update",
    title: "Update diagram",
    category: "diagrams",
    description: "Update the diagram DSL on an existing file.",
    inputSchema: objectSchema({ fileId: { type: "string" }, source: { type: "string" } }, ["fileId", "source"])
  },
  {
    name: "ai.diagrams.generate",
    title: "Generate diagram",
    category: "ai",
    description: "Generate a reviewable diagram draft from a prompt.",
    inputSchema: objectSchema({
      prompt: { type: "string" },
      diagramType: { type: "string" },
      fileId: { type: "string" }
    }, ["prompt"])
  },
  {
    name: "ai.diagrams.edit",
    title: "Edit diagram",
    category: "ai",
    description: "Apply an AI edit action to diagram DSL.",
    inputSchema: objectSchema({ source: { type: "string" }, action: { type: "string" }, fileId: { type: "string" } }, ["source", "action"])
  },
  {
    name: "ai.diagrams.explain",
    title: "Explain diagram",
    category: "ai",
    description: "Summarize a diagram and return risks and next actions.",
    inputSchema: objectSchema({ source: { type: "string" } }, ["source"])
  },
  {
    name: "comments.list",
    title: "List comments",
    category: "comments",
    description: "List comments for a file.",
    inputSchema: objectSchema({ fileId: { type: "string" } }, ["fileId"])
  },
  {
    name: "comments.create",
    title: "Create comment",
    category: "comments",
    description: "Add a comment to a file.",
    inputSchema: objectSchema({
      fileId: { type: "string" },
      text: { type: "string" },
      author: { type: "string" },
      target: { type: "string" }
    }, ["fileId", "text"])
  },
  {
    name: "comments.resolve",
    title: "Resolve comment",
    category: "comments",
    description: "Resolve an open comment.",
    inputSchema: objectSchema({ commentId: { type: "string" } }, ["commentId"])
  },
  {
    name: "versions.list",
    title: "List versions",
    category: "versions",
    description: "List file versions.",
    inputSchema: objectSchema({ fileId: { type: "string" } }, ["fileId"])
  },
  {
    name: "versions.create",
    title: "Create version",
    category: "versions",
    description: "Create a named file version.",
    inputSchema: objectSchema({
      fileId: { type: "string" },
      label: { type: "string" },
      by: { type: "string" }
    }, ["fileId", "label"])
  },
  {
    name: "versions.restore",
    title: "Restore version",
    category: "versions",
    description: "Restore a file version marker.",
    inputSchema: objectSchema({ fileId: { type: "string" }, versionId: { type: "string" } }, ["fileId", "versionId"])
  },
  {
    name: "exports.create",
    title: "Create export",
    category: "exports",
    description: "Create an export job for a file.",
    inputSchema: objectSchema({
      fileId: { type: "string" },
      format: { type: "string", enum: ["PNG", "SVG", "PDF", "HTML", "Markdown", "Clipboard"] }
    }, ["fileId", "format"])
  },
  {
    name: "exports.status",
    title: "Export status",
    category: "exports",
    description: "Read an export job status.",
    inputSchema: objectSchema({ exportId: { type: "string" } }, ["exportId"])
  },
  {
    name: "exports.cancel",
    title: "Cancel export",
    category: "exports",
    description: "Cancel an export job.",
    inputSchema: objectSchema({ exportId: { type: "string" } }, ["exportId"])
  },
  {
    name: "integrations.list",
    title: "List integrations",
    category: "integrations",
    description: "List connected integrations.",
    inputSchema: emptyInputSchema
  },
  {
    name: "integrations.reconnect",
    title: "Reconnect integration",
    category: "integrations",
    description: "Mark an integration as reconnected.",
    inputSchema: objectSchema({ integrationId: { type: "string" } }, ["integrationId"])
  },
  {
    name: "git.commit",
    title: "Commit sync",
    category: "git",
    description: "Create a Git sync commit marker.",
    inputSchema: objectSchema({
      fileId: { type: "string" },
      message: { type: "string" },
      branch: { type: "string" }
    }, ["fileId", "message", "branch"])
  },
  {
    name: "git.conflicts.resolve",
    title: "Resolve Git conflict",
    category: "git",
    description: "Resolve a Git sync conflict by strategy.",
    inputSchema: objectSchema({ fileId: { type: "string" }, strategy: { type: "string" } }, ["fileId", "strategy"])
  },
  {
    name: "apiKeys.list",
    title: "List API keys",
    category: "api",
    description: "List workspace API keys.",
    inputSchema: emptyInputSchema
  },
  {
    name: "apiKeys.create",
    title: "Create API key",
    category: "api",
    description: "Create an API key.",
    inputSchema: objectSchema({ name: { type: "string" }, scope: { type: "string" } }, ["name", "scope"])
  },
  {
    name: "apiKeys.revoke",
    title: "Revoke API key",
    category: "api",
    description: "Revoke an API key.",
    inputSchema: objectSchema({ keyId: { type: "string" } }, ["keyId"])
  },
  {
    name: "webhooks.create",
    title: "Create webhook",
    category: "webhooks",
    description: "Create a webhook subscription.",
    inputSchema: objectSchema({ url: { type: "string" }, events: { type: "array", items: { type: "string" } } }, ["url", "events"])
  }
];

const mcpToolNames = new Set(mcpTools.map((tool) => tool.name));
const exportFormatSchema = z.enum(["PNG", "SVG", "PDF", "HTML", "Markdown", "Clipboard"]);
const shareRoleSchema = z.enum(["viewer", "commenter", "editor"]);
const mcpCallSchema = z.object({
  tool: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  arguments: z.record(z.unknown()).optional(),
  input: z.record(z.unknown()).optional()
}).refine((body) => body.tool || body.name, { message: "tool or name is required" });
const mcpJsonRpcSchema = z.object({
  jsonrpc: z.literal("2.0").optional(),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string().min(1),
  params: z.record(z.unknown()).optional()
});

integrationsRouter.get("/integrations", (_req, res) => {
  res.json({ data: integrations });
});

integrationsRouter.patch("/integrations/:integrationId/reconnect", (req, res) => {
  res.json({ data: { integrationId: req.params.integrationId, status: "connected", reconnectedAt: new Date().toISOString() } });
});

integrationsRouter.post(
  "/git/sync/commit",
  validateBody(z.object({ fileId: z.string().min(1), message: z.string().min(1), branch: z.string().min(1) })),
  (req, res) => {
    res.status(201).json({ data: { commitSha: "devsha123", ...req.body } });
  }
);

integrationsRouter.post("/git/sync/conflicts/resolve", validateBody(z.object({ fileId: z.string().min(1), strategy: z.string().min(1) })), (req, res) => {
  res.json({ data: { fileId: req.body.fileId, strategy: req.body.strategy, status: "resolved" } });
});

integrationsRouter.get("/mcp/tools", (_req, res) => {
  res.json({
    data: mcpTools,
    meta: {
      count: mcpTools.length,
      names: mcpTools.map((tool) => tool.name)
    }
  });
});

integrationsRouter.post("/mcp/call", validateBody(mcpCallSchema), (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof mcpCallSchema>;
    const toolName = body.tool ?? body.name ?? "";
    const args = body.arguments ?? body.input ?? {};
    res.json({ data: { tool: toolName, result: executeMcpTool(toolName, args) } });
  } catch (error) {
    next(error);
  }
});

integrationsRouter.post("/mcp", validateBody(mcpJsonRpcSchema), (req, res) => {
  const body = req.body as z.infer<typeof mcpJsonRpcSchema>;
  const response = handleMcpJsonRpc(body);
  res.status(response.error ? 400 : 200).json(response);
});

integrationsRouter.post("/webhooks", validateBody(z.object({ url: z.string().url(), events: z.array(z.string()).min(1) })), (req, res) => {
  res.status(201).json({ data: { id: `wh_${Date.now()}`, ...req.body, status: "active" } });
});

function objectSchema(properties: Record<string, unknown>, required: string[] = []) {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false
  };
}

function getActiveTeam() {
  return teamDirectory.find((team) => team.id === selectedTeamId) ?? teamDirectory[0];
}

function normalizeTeam(input: { teamId?: string; teamName?: string }) {
  const lowerName = input.teamName?.toLowerCase().trim();
  if (input.teamId) {
    return teamDirectory.find((team) => team.id === input.teamId);
  }
  if (lowerName) {
    return teamDirectory.find((team) => (team.name.toLowerCase() === lowerName || team.slug.toLowerCase() === lowerName));
  }
  return undefined;
}

function mapDiagramType(raw: string | undefined) {
  const normalized = raw?.toLowerCase().trim() ?? "architecture";
  return supportedDiagramTypeMap.get(normalized) ?? "cloud-architecture-diagram";
}

function resolveFolder(folderId?: string, fallback = "Unsorted") {
  if (!folderId) return fallback;
  const folder = mutableFolders.find((item) => item.id === folderId || item.title === folderId);
  return folder?.title ?? fallback;
}

function getPresetOrThrow(presetId: string) {
  const preset = mutablePresets.get(presetId);
  if (!preset) {
    throw new HttpError(404, "Preset not found", "preset_not_found");
  }
  return preset;
}

function ensureFolderRefCounts() {
  mutableFolders.forEach((folder) => {
    const count = listFiles().filter((file) => file.folder === folder.title).length;
    folder.kind = `${count} files`;
  });
}

function normalizePagination(params: { limit?: number | null; cursor?: number | null; offset?: number | null }) {
  const rawLimit = params.limit ?? 50;
  const safeLimit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(120, Math.floor(rawLimit))) : 50;
  const rawCursor = params.cursor ?? params.offset;
  const safeCursor = Number.isFinite(rawCursor as number) ? Math.max(0, Math.floor(rawCursor as number)) : 0;
  return { limit: safeLimit, cursor: safeCursor };
}

function applyListPagination<T>(items: T[], params: { limit?: number | null; cursor?: number | null; offset?: number | null }, baseTotal: number, sortBy = "updatedAt", sortDir: SortDirection = "desc") {
  const sorted = [...items];
  sorted.sort((a, b) => {
    if (!a || !b) return 0;
    const left = (a as { [key: string]: unknown })[sortBy];
    const right = (b as { [key: string]: unknown })[sortBy];
    const l = typeof left === "number" ? left : Number(String(left ?? 0));
    const r = typeof right === "number" ? right : Number(String(right ?? 0));
    const compare = l - r;
    return sortDir === "asc" ? compare : -compare;
  });
  const { limit, cursor } = normalizePagination(params);
  const start = Math.min(Math.max(cursor, 0), Math.max(sorted.length, 0));
  const end = Math.min(start + limit, sorted.length);
  const itemsPage = sorted.slice(start, end);
  const nextCursor = end < sorted.length ? end : null;
  return { items: itemsPage, total: baseTotal, limit, offset: start, cursor: start, nextCursor };
}

function ensureDiagramStoreSynced() {
  const files = listFiles();
  for (const file of files) {
    const key = `diagram-${file.id}-0`;
    if (!diagramStore.has(key)) {
      const created = Date.now();
      const record: DiagramRecord = {
        id: key,
        fileId: file.id,
        title: file.title,
        source: file.diagramDsl ?? "",
        diagramType: "cloud-architecture-diagram",
        createdAt: created,
        updatedAt: created
      };
      diagramStore.set(key, record);
      fileDiagramIndex.set(file.id, [key, ...(fileDiagramIndex.get(file.id) ?? [])]);
    }
    ensureFileMetadata(file.id);
  }
}

function ensureFileMetadata(fileId: string) {
  if (mutableFileMetadata.has(fileId)) return;
  const file = getFile(fileId);
  if (!file) return;
  const now = Date.now();
  mutableFileMetadata.set(fileId, {
    createdAt: now,
    updatedAt: now,
    author: file.owner
  });
}

function updateFileMetadata(fileId: string, patch: Partial<{ createdAt: number; updatedAt: number; author: string }>) {
  const current = mutableFileMetadata.get(fileId);
  if (!current) {
    ensureFileMetadata(fileId);
  }
  const next = mutableFileMetadata.get(fileId) ?? { createdAt: Date.now(), updatedAt: Date.now(), author: "Founder" };
  mutableFileMetadata.set(fileId, { ...next, ...patch });
}

function listFolders(folderId?: string | null) {
  return mutableFolders.filter((folder) => folder.parentFolderId === folderId);
}

function findFolder(folderId?: string, fallback = false) {
  if (!folderId) return fallback ? mutableFolders[0] : undefined;
  return mutableFolders.find((folder) => folder.id === folderId || folder.title === folderId) ?? undefined;
}

function resolveFolderId(folderId?: string) {
  const folder = findFolder(folderId);
  return folder?.id;
}

function resolveDiagram(diagramId: string) {
  const diagram = diagramStore.get(diagramId);
  if (!diagram) {
    throw new HttpError(404, "Diagram not found", "diagram_not_found");
  }
  return diagram;
}

function listDiagrams(fileId?: string) {
  const ids = fileId ? (fileDiagramIndex.get(fileId) ?? []) : [...diagramStore.keys()];
  return ids.map((id) => diagramStore.get(id)).filter((item): item is DiagramRecord => Boolean(item));
}

function assignDiagramToFile(fileId: string, diagram: DiagramRecord) {
  const current = fileDiagramIndex.get(fileId) ?? [];
  if (!current.includes(diagram.id)) {
    fileDiagramIndex.set(fileId, [...current, diagram.id]);
  }
  updateExistingFile(fileId, { diagramDsl: diagram.source });
}

function setExportResult({
  fileId,
  diagramId,
  format,
  theme,
  imageQuality,
  background
}: {
  fileId: string;
  diagramId: string;
  format?: string;
  theme?: string;
  imageQuality?: number;
  background?: boolean;
}) {
  const normalizedFormat = (format ?? "").toLowerCase();
  if (!supportedImageFormats.has(normalizedFormat)) {
    return undefined;
  }
  const exportResult = createExportJob(normalizedFormat.toUpperCase(), fileId);
  return {
    diagramId,
    fileId,
    format: normalizedFormat,
    url: exportResult.url,
    status: exportResult.status,
    theme: theme ?? "dark",
    imageQuality: imageQuality ?? 2,
    background: background !== false,
    progress: exportResult.progress
  };
}

function buildDiagramRecord(fileId: string, source: string, diagramType: string, title?: string) {
  const id = `diagram-${fileId}-${Date.now()}`;
  const now = Date.now();
  return {
    id,
    fileId,
    title: title ?? "Diagram",
    source,
    diagramType: mapDiagramType(diagramType),
    createdAt: now,
    updatedAt: now
  };
}

function createDiagramInFile(fileId: string, source: string, diagramType: string, title?: string) {
  const file = readFileOrThrow(fileId);
  const record = buildDiagramRecord(file.id, source, diagramType, title);
  const existing = fileDiagramIndex.get(file.id) ?? [];
  fileDiagramIndex.set(file.id, [...existing, record.id]);
  diagramStore.set(record.id, record);
  updateFileMetadata(file.id, { updatedAt: Date.now(), author: file.owner });
  updateExistingFile(file.id, { diagramDsl: source });
  return record;
}

function deleteDiagramFromFile(fileId: string, diagramId: string) {
  const current = fileDiagramIndex.get(fileId) ?? [];
  const next = current.filter((id) => id !== diagramId);
  if (next.length === current.length) {
    throw new HttpError(404, "Diagram not found", "diagram_not_found");
  }
  fileDiagramIndex.set(fileId, next);
  diagramStore.delete(diagramId);
  const file = readFileOrThrow(fileId);
  const remaining = next[0];
  if (remaining) {
    const record = diagramStore.get(remaining);
    if (record) {
      updateExistingFile(file.id, { diagramDsl: record.source });
    }
  } else {
    updateExistingFile(file.id, { diagramDsl: "diagram flowchart\n" });
  }
}

function collectNestedFolders(rootFolderId?: string | null) {
  const nested = new Set<string>();
  const visit = (folderId?: string | null) => {
    const children = listFolders(folderId);
    for (const child of children) {
      if (nested.has(child.id)) continue;
      nested.add(child.id);
      visit(child.id);
    }
  };
  visit(rootFolderId);
  return nested;
}

function executeMcpTool(toolName: string, args: ToolArguments) {
  if (!mcpToolNames.has(toolName)) {
    throw new HttpError(404, `Unknown MCP tool: ${toolName}`, "mcp_tool_not_found");
  }

  switch (toolName) {
    case "workspace.bootstrap":
      return getBootstrapData();
    case "selectTeam": {
      const input = z.object({ teamId: z.string().min(1) }).parse(args);
      return { teamId: input.teamId, status: "selected", selectedAt: new Date().toISOString() };
    }
    case "get": {
      const input = z.object({
        resource: z.string().min(1),
        fileId: z.string().optional(),
        diagramId: z.string().optional(),
        folderId: z.string().optional(),
        presetId: z.string().optional(),
        id: z.string().optional()
      }).parse(args);
      const targetId = input.fileId || input.folderId || input.presetId || input.diagramId || input.id || "";
      const resource = input.resource.toLowerCase();
      if (resource === "file") {
        if (!targetId) throw new HttpError(400, "fileId is required for resource file", "missing_argument");
        return readFileOrThrow(targetId);
      }
      if (resource === "folder") {
        return folders.find((folder) => folder.id === targetId || folder.title === targetId) ?? null;
      }
      if (resource === "preset") {
        return { id: targetId || "default-preset", name: "Default preset", rules: "default", isDefault: true };
      }
      if (resource === "diagram") {
        if (!targetId) throw new HttpError(400, "diagramId is required for resource diagram", "missing_argument");
        const fileId = input.fileId || input.id;
        if (!fileId) {
          return { id: targetId, source: "", fileId: null };
        }
        const file = readFileOrThrow(fileId);
        return { id: targetId, fileId, source: file.diagramDsl };
      }
      return null;
    }
    case "list": {
      const input = z.object({ resource: z.string().min(1), query: z.string().optional() }).parse(args);
      const resource = input.resource.toLowerCase();
      const query = input.query?.toLowerCase() ?? "";
      if (resource === "file") {
        return listFiles().filter((item) => query ? item.title.toLowerCase().includes(query) : true);
      }
      if (resource === "folder") {
        return mutableFolders.filter((item) => query ? item.title.toLowerCase().includes(query) : true);
      }
      if (resource === "preset") {
        return [{ id: "default-preset", name: "Default preset", rules: "default", isDefault: true }];
      }
      if (resource === "diagram") {
        return listFiles().filter((file) => query ? [file.title, file.diagramDsl].some((text) => text.toLowerCase().includes(query)) : true).map((file) => ({
          id: `${file.id}-diagram`,
          fileId: file.id,
          source: file.diagramDsl
        }));
      }
      return listFiles();
    }
    case "create": {
      const input = z.object({
        resource: z.string().min(1),
        title: z.string().optional(),
        name: z.string().optional(),
        text: z.string().optional(),
        folder: z.string().optional(),
        kind: z.string().optional(),
        parentFolderId: z.string().optional(),
        share: z.string().optional()
      }).parse(args);
      const resource = input.resource.toLowerCase();
      if (resource === "file") {
        const created = createFile({
          title: input.title ?? input.name ?? `eraser-file-${Date.now()}`,
          kind: input.kind ?? "Diagram",
          folder: input.folder ?? "Product"
        });
        if (input.text) {
          updateExistingFile(created.id, { markdown: input.text });
        }
        if (input.share) {
          updateExistingFile(created.id, { shared: true });
        }
        return created;
      }
      if (resource === "folder") {
        const folder = {
          id: `folder-${Date.now()}`,
          title: input.name ?? "New folder",
          kind: "0 files",
          parentFolderId: input.parentFolderId ?? null
        };
        mutableFolders.push(folder);
        return folder;
      }
      if (resource === "preset") {
        return {
          id: `preset-${Date.now()}`,
          name: input.name ?? "New preset",
          rules: input.text ?? "",
          isDefault: false
        };
      }
      return null;
    }
    case "update": {
      const input = z.object({
        resource: z.string().min(1),
        fileId: z.string().optional(),
        diagramId: z.string().optional(),
        folderId: z.string().optional(),
        presetId: z.string().optional(),
        id: z.string().optional(),
        title: z.string().optional(),
        text: z.string().optional(),
        markdown: z.string().optional(),
        diagramDsl: z.string().optional(),
        name: z.string().optional(),
        parentFolderId: z.string().optional()
      }).parse(args);
      const resource = input.resource.toLowerCase();
      if (resource === "file") {
        const target = input.fileId || input.id;
        if (!target) throw new HttpError(400, "fileId is required for resource file", "missing_argument");
        return updateExistingFile(target, { title: input.title, markdown: input.markdown ?? input.text, diagramDsl: input.diagramDsl });
      }
      if (resource === "diagram") {
        const target = input.fileId || input.diagramId || input.id;
        if (!target) throw new HttpError(400, "fileId is required for resource diagram", "missing_argument");
        const source = input.diagramDsl ?? input.text;
        return source ? updateExistingFile(target, { diagramDsl: source }) : readFileOrThrow(target);
      }
      if (resource === "folder") {
        const target = input.folderId || input.id;
        if (!target) throw new HttpError(400, "folderId is required for resource folder", "missing_argument");
        const index = mutableFolders.findIndex((folder) => folder.id === target);
        if (index === -1) throw new HttpError(404, "Folder not found", "folder_not_found");
        mutableFolders[index] = {
          ...mutableFolders[index],
          title: input.name ?? mutableFolders[index].title,
          parentFolderId: input.parentFolderId ?? mutableFolders[index].parentFolderId
        };
        return mutableFolders[index];
      }
      if (resource === "preset") {
        return {
          id: input.presetId || input.id || "default-preset",
          name: input.name ?? "Preset",
          rules: input.text ?? "",
          isDefault: false
        };
      }
      return null;
    }
    case "delete": {
      const input = z.object({
        resource: z.string().min(1),
        fileId: z.string().optional(),
        diagramId: z.string().optional(),
        folderId: z.string().optional(),
        presetId: z.string().optional(),
        id: z.string().optional()
      }).parse(args);
      const resource = input.resource.toLowerCase();
      if (resource === "file") {
        const target = input.fileId || input.id;
        if (!target) throw new HttpError(400, "fileId is required for resource file", "missing_argument");
        const file = softDeleteFile(target);
        if (!file) throw new HttpError(404, "File not found", "file_not_found");
        return file;
      }
      if (resource === "diagram") {
        const target = input.diagramId || input.id;
        return { id: target, status: "deleted", resource: "diagram" };
      }
      if (resource === "folder") {
        const target = input.folderId || input.id;
        const index = mutableFolders.findIndex((folder) => folder.id === target);
        if (index === -1) throw new HttpError(404, "Folder not found", "folder_not_found");
        return { ...mutableFolders[index], status: "deleted" };
      }
      if (resource === "preset") {
        return { id: input.presetId || input.id, status: "deleted", resource: "preset" };
      }
      return { status: "ignored", resource };
    }
    case "search": {
      const input = z.object({ query: z.string().min(1), resource: z.string().optional() }).parse(args);
      const resource = input.resource?.toLowerCase() ?? "all";
      const q = input.query.toLowerCase();
      if (resource === "folder") {
        return mutableFolders.filter((folder) => folder.title.toLowerCase().includes(q));
      }
      if (resource === "diagram") {
        return listFiles().filter((file) => [file.title, file.diagramDsl].some((item) => item.toLowerCase().includes(q))).map((file) => ({
          id: `${file.id}-diagram`,
          fileId: file.id,
          source: file.diagramDsl
        }));
      }
      if (resource === "preset") {
        return [{ id: "default-preset", name: "Default preset", rules: "default", isDefault: true }];
      }
      return listFiles().filter((file) => file.title.toLowerCase().includes(q) || file.markdown.toLowerCase().includes(q) || file.diagramDsl.toLowerCase().includes(q));
    }
    case "generate": {
      const input = z.object({
        resource: z.string().min(1),
        text: z.string().optional(),
        prompt: z.string().optional(),
        targetFileId: z.string().optional(),
        fileId: z.string().optional(),
        diagramType: z.string().optional(),
        colorMode: z.string().optional(),
        styleMode: z.string().optional(),
        typeface: z.string().optional(),
        direction: z.string().optional(),
        theme: z.string().optional(),
        format: z.string().optional(),
        diagramId: z.string().optional(),
        code: z.string().optional()
      }).parse(args);
      const resource = input.resource.toLowerCase();
      const prompt = input.text ?? input.prompt;
      if (!prompt) throw new HttpError(400, "text or prompt is required", "missing_argument");
      const generated = generateDiagram({
        prompt,
        diagramType: input.diagramType ?? "architecture"
      });
      const source = input.code ?? generated.diagramDsl;

      if (resource === "file") {
        const created = createFile({
          title: input.targetFileId ? `Generated ${input.targetFileId}` : `Generated diagram ${Date.now()}`,
          kind: "Diagram",
          folder: "Product"
        });
        return updateExistingFile(created.id, { diagramDsl: source });
      }
      if (resource === "diagram") {
        const target = input.fileId || input.targetFileId;
        if (!target) {
          return generated;
        }
        return updateExistingFile(target, { diagramDsl: source });
      }
      return generated;
    }
    case "files.list":
      return listFiles();
    case "files.read": {
      const input = z.object({ fileId: z.string().min(1).optional() }).parse(args);
      return input.fileId ? readFileOrThrow(input.fileId) : listFiles();
    }
    case "files.create": {
      const input = z.object({
        title: z.string().min(1),
        kind: z.string().min(1).default("Diagram"),
        folder: z.string().min(1).default("Product"),
        markdown: z.string().optional(),
        diagramDsl: z.string().optional()
      }).parse(args);
      const file = createFile({ title: input.title, kind: input.kind, folder: input.folder });
      if (input.markdown || input.diagramDsl) {
        return updateExistingFile(file.id, { markdown: input.markdown, diagramDsl: input.diagramDsl });
      }
      return file;
    }
    case "files.update": {
      const input = z.object({
        fileId: z.string().min(1),
        title: z.string().min(1).optional(),
        markdown: z.string().optional(),
        diagramDsl: z.string().optional(),
        shared: z.boolean().optional()
      }).parse(args);
      const { fileId, ...patch } = input;
      return updateExistingFile(fileId, patch);
    }
    case "files.delete": {
      const input = z.object({ fileId: z.string().min(1) }).parse(args);
      const file = softDeleteFile(input.fileId);
      if (!file) throw new HttpError(404, "File not found", "file_not_found");
      return file;
    }
    case "files.restore": {
      const input = z.object({ fileId: z.string().min(1) }).parse(args);
      const file = restoreFile(input.fileId);
      if (!file) throw new HttpError(404, "File not found", "file_not_found");
      return file;
    }
    case "files.share": {
      const input = z.object({
        fileId: z.string().min(1),
        role: shareRoleSchema.default("viewer"),
        expiresAt: z.string().optional()
      }).parse(args);
      return createShareResponse(input.fileId, input.role, input.expiresAt);
    }
    case "diagrams.examples":
      return getDiagramExamples();
    case "diagrams.parse": {
      const input = sourceArgsSchema().parse(args);
      return parseDiagramDsl(input.source);
    }
    case "diagrams.layout": {
      const input = sourceArgsSchema().parse(args);
      return layoutDiagram(input.source);
    }
    case "diagrams.quickFix": {
      const input = sourceArgsSchema().parse(args);
      return { source: quickFixDiagramDsl(input.source) };
    }
    case "diagrams.convert": {
      const input = z.object({ source: z.string().min(1), targetType: z.string().min(1) }).parse(args);
      const source = quickFixDiagramDsl(input.source).replace(/^diagram .+$/m, `diagram ${input.targetType}`);
      return { source, targetType: input.targetType };
    }
    case "diagrams.create": {
      const input = z.object({
        title: z.string().min(1),
        source: z.string().optional(),
        folder: z.string().min(1).default("Product"),
        diagramType: z.string().min(1).default("flowchart")
      }).parse(args);
      const source = input.source ?? `diagram ${input.diagramType}\nStart -> End: complete`;
      const file = createFile({ title: input.title, kind: "Diagram", folder: input.folder });
      return updateExistingFile(file.id, { diagramDsl: source });
    }
    case "diagrams.update": {
      const input = z.object({ fileId: z.string().min(1), source: z.string().min(1) }).parse(args);
      return updateExistingFile(input.fileId, { diagramDsl: input.source });
    }
    case "ai.diagrams.generate": {
      const input = z.object({
        prompt: z.string().min(1),
        diagramType: z.string().optional(),
        fileId: z.string().optional()
      }).parse(args);
      return generateDiagram(input);
    }
    case "ai.diagrams.edit": {
      const input = z.object({
        source: z.string().min(1),
        action: z.string().min(1),
        fileId: z.string().optional()
      }).parse(args);
      return editDiagram(input);
    }
    case "ai.diagrams.explain": {
      const input = sourceArgsSchema().parse(args);
      return explainDiagram(input.source);
    }
    case "comments.list": {
      const input = z.object({ fileId: z.string().min(1) }).parse(args);
      return listComments(input.fileId);
    }
    case "comments.create": {
      const input = z.object({
        fileId: z.string().min(1),
        text: z.string().min(1),
        author: z.string().optional(),
        target: z.string().optional()
      }).parse(args);
      return addComment(input.fileId, input);
    }
    case "comments.resolve": {
      const input = z.object({ commentId: z.string().min(1) }).parse(args);
      const comment = resolveComment(input.commentId);
      if (!comment) throw new HttpError(404, "Comment not found", "comment_not_found");
      return comment;
    }
    case "versions.list": {
      const input = z.object({ fileId: z.string().min(1) }).parse(args);
      return listVersions(input.fileId);
    }
    case "versions.create": {
      const input = z.object({
        fileId: z.string().min(1),
        label: z.string().min(1),
        by: z.string().optional()
      }).parse(args);
      readFileOrThrow(input.fileId);
      return addVersion(input.fileId, input.label, input.by);
    }
    case "versions.restore": {
      const input = z.object({ fileId: z.string().min(1), versionId: z.string().min(1) }).parse(args);
      readFileOrThrow(input.fileId);
      return { fileId: input.fileId, versionId: input.versionId, status: "restored" };
    }
    case "exports.create": {
      const input = z.object({ fileId: z.string().min(1), format: exportFormatSchema }).parse(args);
      readFileOrThrow(input.fileId);
      return createExportJob(input.format, input.fileId);
    }
    case "exports.status": {
      const input = z.object({ exportId: z.string().min(1) }).parse(args);
      const job = getExportJob(input.exportId);
      if (!job) throw new HttpError(404, "Export job not found", "export_not_found");
      return job;
    }
    case "exports.cancel": {
      const input = z.object({ exportId: z.string().min(1) }).parse(args);
      const job = cancelExportJob(input.exportId);
      if (!job) throw new HttpError(404, "Export job not found", "export_not_found");
      return job;
    }
    case "integrations.list":
      return integrations;
    case "integrations.reconnect": {
      const input = z.object({ integrationId: z.string().min(1) }).parse(args);
      return { integrationId: input.integrationId, status: "connected", reconnectedAt: new Date().toISOString() };
    }
    case "git.commit": {
      const input = z.object({
        fileId: z.string().min(1),
        message: z.string().min(1),
        branch: z.string().min(1)
      }).parse(args);
      readFileOrThrow(input.fileId);
      return { commitSha: "devsha123", ...input };
    }
    case "git.conflicts.resolve": {
      const input = z.object({ fileId: z.string().min(1), strategy: z.string().min(1) }).parse(args);
      readFileOrThrow(input.fileId);
      return { fileId: input.fileId, strategy: input.strategy, status: "resolved" };
    }
    case "apiKeys.list":
      return getBootstrapData().apiKeys;
    case "apiKeys.create": {
      const input = z.object({ name: z.string().min(1), scope: z.string().min(1) }).parse(args);
      return createApiKey(input);
    }
    case "apiKeys.revoke": {
      const input = z.object({ keyId: z.string().min(1) }).parse(args);
      const key = revokeApiKey(input.keyId);
      if (!key) throw new HttpError(404, "API key not found", "api_key_not_found");
      return key;
    }
    case "webhooks.create": {
      const input = z.object({ url: z.string().url(), events: z.array(z.string()).min(1) }).parse(args);
      return { id: `wh_${Date.now()}`, ...input, status: "active" };
    }
    default:
      throw new HttpError(404, `Unknown MCP tool: ${toolName}`, "mcp_tool_not_found");
  }
}

function handleMcpJsonRpc(body: z.infer<typeof mcpJsonRpcSchema>) {
  try {
    if (body.method === "initialize") {
      return {
        jsonrpc: "2.0",
        id: body.id ?? null,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "drawai-eraser-compatible", version: "0.1.0" }
        }
      };
    }

    if (body.method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id: body.id ?? null,
        result: {
          tools: mcpTools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
        }
      };
    }

    if (body.method === "tools/call") {
      const params = z.object({
        name: z.string().min(1),
        arguments: z.record(z.unknown()).optional()
      }).parse(body.params ?? {});
      const result = executeMcpTool(params.name, params.arguments ?? {});
      return {
        jsonrpc: "2.0",
        id: body.id ?? null,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result
        }
      };
    }

    return {
      jsonrpc: "2.0",
      id: body.id ?? null,
      error: { code: -32601, message: `Unsupported MCP method: ${body.method}` }
    };
  } catch (error) {
    return {
      jsonrpc: "2.0",
      id: body.id ?? null,
      error: {
        code: error instanceof HttpError ? error.statusCode : -32602,
        message: error instanceof Error ? error.message : "Invalid MCP request"
      }
    };
  }
}

function sourceArgsSchema() {
  return z.object({ source: z.string().min(1) });
}

function readFileOrThrow(fileId: string) {
  const file = getFile(fileId);
  if (!file) {
    throw new HttpError(404, "File not found", "file_not_found");
  }
  return file;
}

function updateExistingFile(fileId: string, patch: Parameters<typeof updateFile>[1]) {
  const file = updateFile(fileId, patch);
  if (!file) {
    throw new HttpError(404, "File not found", "file_not_found");
  }
  return file;
}

function createShareResponse(fileId: string, role: "viewer" | "commenter" | "editor", expiresAt?: string) {
  readFileOrThrow(fileId);
  return {
    fileId,
    role,
    url: `https://drawai.local/share/${fileId}.${role}.devtoken`,
    expiresAt: expiresAt ?? null
  };
}
