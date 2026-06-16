import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { integrations } from "../../data/mock-data.js";
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

const emptyInputSchema = {
  type: "object",
  properties: {},
  additionalProperties: false
};

const mcpTools: McpTool[] = [
  {
    name: "workspace.bootstrap",
    title: "Bootstrap workspace",
    category: "workspace",
    description: "Read the current workspace, files, folders, templates, members, usage, and plans.",
    inputSchema: emptyInputSchema
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

function executeMcpTool(toolName: string, args: ToolArguments) {
  if (!mcpToolNames.has(toolName)) {
    throw new HttpError(404, `Unknown MCP tool: ${toolName}`, "mcp_tool_not_found");
  }

  switch (toolName) {
    case "workspace.bootstrap":
      return getBootstrapData();
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
