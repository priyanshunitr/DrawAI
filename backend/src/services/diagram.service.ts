import { diagramExamples } from "../data/mock-data.js";

export type DiagramNode = {
  id: string;
  label: string;
};

export type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
};

export function parseDiagramDsl(source: string) {
  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const header = lines[0]?.startsWith("diagram ") ? lines.shift() ?? "diagram unknown" : "diagram unknown";
  const type = header.replace("diagram ", "").trim() || "unknown";
  const nodes = new Map<string, DiagramNode>();
  const edges: DiagramEdge[] = [];
  const diagnostics: Array<{ line: number; message: string }> = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(.+?)\s*->\s*(.+?)(?::\s*(.+))?$/);
    if (!match) {
      diagnostics.push({ line: index + 2, message: "Expected: Source -> Target: optional label" });
      return;
    }

    const from = match[1]?.trim() ?? "";
    const to = match[2]?.trim() ?? "";
    const label = match[3]?.trim() ?? "";

    nodes.set(from, { id: slugify(from), label: from });
    nodes.set(to, { id: slugify(to), label: to });
    edges.push({ id: `${slugify(from)}-${slugify(to)}-${index}`, from: slugify(from), to: slugify(to), label });
  });

  return { type, nodes: [...nodes.values()], edges, diagnostics };
}

export function layoutDiagram(source: string) {
  const parsed = parseDiagramDsl(source);
  const step = parsed.nodes.length > 1 ? 560 / (parsed.nodes.length - 1) : 0;
  const nodes = parsed.nodes.map((node, index) => ({
    ...node,
    x: Math.max(60, Math.min(560, 100 + step * index)),
    y: 230 + (index % 2 === 0 ? -70 : 70),
    width: 142,
    height: 66
  }));

  return { ...parsed, layout: { nodes } };
}

export function quickFixDiagramDsl(source: string) {
  return source
    .split("\n")
    .map((line) => {
      if (!line.trim() || line.startsWith("diagram ")) return line;
      if (line.includes("=>")) return line.replace("=>", "->");
      if (!line.includes("->") && line.includes(",")) {
        const [from, to] = line.split(",");
        return `${from?.trim() ?? "Source"} -> ${to?.trim() ?? "Target"}: relates`;
      }
      return line;
    })
    .join("\n");
}

export function getDiagramExamples() {
  return diagramExamples;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
