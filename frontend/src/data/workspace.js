export const workspace = {
  name: "DrawAI Product",
  slug: "drawai-product",
  owner: "Founder",
  domain: "drawai.local",
  plan: "Team Pro"
};

export const files = [
  {
    id: "auth-architecture",
    title: "Auth architecture",
    folder: "Architecture",
    kind: "System diagram",
    owner: "Maya",
    updated: "2m ago",
    status: "active",
    shared: true
  },
  {
    id: "billing-flow",
    title: "Billing flow",
    folder: "Payments",
    kind: "Sequence",
    owner: "Dev",
    updated: "18m ago",
    status: "active",
    shared: false
  },
  {
    id: "workspace-schema",
    title: "Workspace schema",
    folder: "Data model",
    kind: "ERD",
    owner: "Ira",
    updated: "1h ago",
    status: "active",
    shared: true
  },
  {
    id: "api-rate-limits",
    title: "API rate limits",
    folder: "Platform",
    kind: "Flowchart",
    owner: "Sam",
    updated: "Yesterday",
    status: "trash",
    shared: false
  }
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
    author: "Maya",
    target: "API gateway",
    text: "Check retry path before launch.",
    status: "open"
  },
  {
    id: "c2",
    author: "Dev",
    target: "Webhook branch",
    text: "Add billing event failure case.",
    status: "open"
  }
];

export const versions = [
  { id: "v4", label: "Current draft", by: "Founder", time: "2m ago" },
  { id: "v3", label: "Added workspace DB", by: "Maya", time: "34m ago" },
  { id: "v2", label: "AI generated first pass", by: "DrawAI", time: "1h ago" },
  { id: "v1", label: "Blank file", by: "Founder", time: "Yesterday" }
];

export const integrations = [
  {
    id: "github",
    name: "GitHub",
    status: "Connected",
    detail: "drawai/core-platform",
    tone: "good"
  },
  {
    id: "notion",
    name: "Notion",
    status: "Needs reconnect",
    detail: "OAuth token expired",
    tone: "warn"
  },
  {
    id: "confluence",
    name: "Confluence",
    status: "Available",
    detail: "Embed diagrams in spaces",
    tone: "neutral"
  },
  {
    id: "vscode",
    name: "VS Code",
    status: "Installed",
    detail: "Diagram DSL extension",
    tone: "good"
  },
  {
    id: "slack",
    name: "Slack",
    status: "Available",
    detail: "Mention notifications",
    tone: "neutral"
  },
  {
    id: "mcp",
    name: "MCP Server",
    status: "Ready",
    detail: "Agent-safe diagram tools",
    tone: "good"
  }
];

export const apiKeys = [
  { id: "key_1", name: "CI exports", scope: "exports:write", lastUsed: "Today" },
  { id: "key_2", name: "Agent workspace", scope: "files:read diagrams:write", lastUsed: "Yesterday" }
];

export const plans = [
  {
    name: "Starter",
    price: "$0",
    limit: "3 files",
    current: false
  },
  {
    name: "Team Pro",
    price: "$20",
    limit: "Unlimited shared files",
    current: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    limit: "SAML, SCIM, audit logs",
    current: false
  }
];
