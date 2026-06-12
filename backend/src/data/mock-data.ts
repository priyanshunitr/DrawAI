export type FileRecord = {
  id: string;
  title: string;
  folder: string;
  kind: string;
  owner: string;
  updated: string;
  status: "active" | "trash";
  shared: boolean;
  markdown: string;
  diagramDsl: string;
};

export const workspace = {
  id: "ws_drawai",
  name: "DrawAI Product",
  slug: "drawai-product",
  owner: "Founder",
  domain: "drawai.local",
  plan: "Team Pro"
};

export const defaultMarkdown = `## Authentication flow
The client exchanges credentials with the API gateway, then stores a short-lived session token after workspace membership checks pass.

### Services
- API gateway validates incoming requests.
- Auth service owns sessions and invite acceptance.
- Workspace service resolves roles and file permissions.

> Review token refresh before enabling public embeds.

- [ ] Add billing webhook failure branch`;

export const diagramExamples = {
  flowchart: `diagram flowchart
Web client -> API gateway: login
API gateway -> Auth service: validate
Auth service -> Workspace DB: membership
Workspace DB -> API gateway: role
API gateway -> Web client: session`,
  sequence: `diagram sequence
User -> Web client: submit credentials
Web client -> API gateway: POST /sessions
API gateway -> Auth service: verify password
Auth service -> Workspace DB: load memberships
API gateway -> User: signed in`,
  erd: `diagram erd
User -> WorkspaceMember: has many
Workspace -> WorkspaceMember: has many
Workspace -> File: owns
File -> Comment: has many`,
  architecture: `diagram architecture
Browser -> API gateway: HTTPS
API gateway -> Auth service: sessions
API gateway -> Diagram service: render
Diagram service -> PostgreSQL: metadata
Diagram service -> Object storage: exports`,
  system: `diagram system
Editor -> Realtime service: presence
Editor -> API service: autosave
API service -> PostgreSQL: versions
Export worker -> Object storage: artifacts`
};

export const files: FileRecord[] = [
  {
    id: "auth-architecture",
    title: "Auth architecture",
    folder: "Architecture",
    kind: "System diagram",
    owner: "Maya",
    updated: "2m ago",
    status: "active",
    shared: true,
    markdown: defaultMarkdown,
    diagramDsl: diagramExamples.architecture
  },
  {
    id: "billing-flow",
    title: "Billing flow",
    folder: "Payments",
    kind: "Sequence",
    owner: "Dev",
    updated: "18m ago",
    status: "active",
    shared: false,
    markdown: defaultMarkdown.replace("Authentication", "Billing"),
    diagramDsl: diagramExamples.sequence
  },
  {
    id: "workspace-schema",
    title: "Workspace schema",
    folder: "Data model",
    kind: "ERD",
    owner: "Ira",
    updated: "1h ago",
    status: "active",
    shared: true,
    markdown: defaultMarkdown.replace("Authentication", "Workspace"),
    diagramDsl: diagramExamples.erd
  },
  {
    id: "api-rate-limits",
    title: "API rate limits",
    folder: "Platform",
    kind: "Flowchart",
    owner: "Sam",
    updated: "Yesterday",
    status: "trash",
    shared: false,
    markdown: defaultMarkdown.replace("Authentication", "Rate limits"),
    diagramDsl: diagramExamples.flowchart
  }
];

export const folders = [
  { id: "folder-architecture", title: "Architecture", kind: "3 files" },
  { id: "folder-payments", title: "Payments", kind: "2 files" },
  { id: "folder-data", title: "Data model", kind: "4 files" }
];

export const templates = [
  "System architecture",
  "API sequence",
  "Entity relationship",
  "Deployment plan",
  "Incident review"
];

export const teamMembers = [
  { name: "Maya", role: "Owner", color: "#1f766f" },
  { name: "Dev", role: "Editor", color: "#2f65c8" },
  { name: "Ira", role: "Commenter", color: "#ad6b1d" },
  { name: "Sam", role: "Viewer", color: "#7c3d92" }
];

export const comments = [
  {
    id: "c1",
    fileId: "auth-architecture",
    author: "Maya",
    target: "API gateway",
    text: "Check retry path before launch.",
    status: "open"
  },
  {
    id: "c2",
    fileId: "auth-architecture",
    author: "Dev",
    target: "Webhook branch",
    text: "Add billing event failure case.",
    status: "open"
  }
];

export const versions = [
  { id: "v4", fileId: "auth-architecture", label: "Current draft", by: "Founder", time: "2m ago" },
  { id: "v3", fileId: "auth-architecture", label: "Added workspace DB", by: "Maya", time: "34m ago" },
  { id: "v2", fileId: "auth-architecture", label: "AI generated first pass", by: "DrawAI", time: "1h ago" },
  { id: "v1", fileId: "auth-architecture", label: "Blank file", by: "Founder", time: "Yesterday" }
];

export const integrations = [
  { id: "github", name: "GitHub", status: "Connected", detail: "drawai/core-platform", tone: "good" },
  { id: "notion", name: "Notion", status: "Needs reconnect", detail: "OAuth token expired", tone: "warn" },
  { id: "confluence", name: "Confluence", status: "Available", detail: "Embed diagrams in spaces", tone: "neutral" },
  { id: "vscode", name: "VS Code", status: "Installed", detail: "Diagram DSL extension", tone: "good" },
  { id: "slack", name: "Slack", status: "Available", detail: "Mention notifications", tone: "neutral" },
  { id: "mcp", name: "MCP Server", status: "Ready", detail: "Agent-safe diagram tools", tone: "good" }
];

export const apiKeys = [
  { id: "key_1", name: "CI exports", scope: "exports:write", lastUsed: "Today", status: "active" },
  { id: "key_2", name: "Agent workspace", scope: "files:read diagrams:write", lastUsed: "Yesterday", status: "active" }
];

export const plans = [
  { name: "Starter", price: "$0", limit: "3 files", current: false },
  { name: "Team Pro", price: "$20", limit: "Unlimited shared files", current: true },
  { name: "Enterprise", price: "Custom", limit: "SAML, SCIM, audit logs", current: false }
];

export const usage = [
  { label: "AI credits", value: "1,240 / 2,000", pct: 62 },
  { label: "API calls", value: "18,204 / 50,000", pct: 36 },
  { label: "Exports", value: "86 / 500", pct: 17 },
  { label: "Version history", value: "42 / 90 days", pct: 47 }
];
