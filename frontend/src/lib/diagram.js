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

export function parseDiagramDsl(source) {
  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const header = lines[0]?.startsWith("diagram ") ? lines.shift() : "diagram unknown";
  const type = header.replace("diagram ", "").trim() || "unknown";
  const nodes = new Map();
  const edges = [];
  const diagnostics = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(.+?)\s*->\s*(.+?)(?::\s*(.+))?$/);

    if (!match) {
      diagnostics.push({
        line: index + 2,
        message: "Expected: Source -> Target: optional label"
      });
      return;
    }

    const from = match[1].trim();
    const to = match[2].trim();
    const label = match[3]?.trim() ?? "";

    nodes.set(from, { id: slugify(from), label: from });
    nodes.set(to, { id: slugify(to), label: to });
    edges.push({
      id: `${slugify(from)}-${slugify(to)}-${index}`,
      from: slugify(from),
      to: slugify(to),
      label
    });
  });

  return {
    type,
    nodes: [...nodes.values()],
    edges,
    diagnostics
  };
}

export function quickFixDiagramDsl(source) {
  return source
    .split("\n")
    .map((line) => {
      if (!line.trim()) return line;
      if (line.startsWith("diagram ")) return line;
      if (line.includes("=>")) return line.replace("=>", "->");
      if (!line.includes("->") && line.includes(",")) {
        const [from, to] = line.split(",");
        return `${from.trim()} -> ${to.trim()}: relates`;
      }
      return line;
    })
    .join("\n");
}

export function diagramLayout(nodes) {
  const width = 760;
  const centerY = 230;
  const step = nodes.length > 1 ? 560 / (nodes.length - 1) : 0;

  return nodes.map((node, index) => ({
    ...node,
    x: 100 + step * index,
    y: centerY + (index % 2 === 0 ? -70 : 70),
    width: 142,
    height: 66
  })).map((node) => ({
    ...node,
    x: Math.max(60, Math.min(width - node.width - 60, node.x - node.width / 2))
  }));
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
