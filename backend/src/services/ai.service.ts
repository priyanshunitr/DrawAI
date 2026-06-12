export function generateDiagram(input: { prompt: string; diagramType?: string }) {
  const diagramType = input.diagramType ?? "architecture";
  const prompt = input.prompt.trim() || "Create a system diagram";

  return {
    id: `ai_${Date.now()}`,
    status: "review",
    credits: estimateCredits(prompt, "generate"),
    diagramDsl: `diagram ${diagramType}
Web client -> API gateway: ${shorten(prompt)}
API gateway -> Auth service: validate
Auth service -> Workspace DB: membership
API gateway -> Export worker: permission check
Export worker -> Object storage: artifact`,
    explanation: "Generated a reviewable diagram draft from the prompt."
  };
}

export function editDiagram(input: { source: string; action: string }) {
  return {
    id: `edit_${Date.now()}`,
    status: "review",
    credits: estimateCredits(input.source, "edit"),
    diagramDsl: `${input.source}\nAPI gateway -> Audit log: ${input.action.toLowerCase()}`,
    explanation: `Applied ${input.action}.`
  };
}

export function explainDiagram(source: string) {
  const edgeCount = source.split("\n").filter((line) => line.includes("->")).length;

  return {
    summary: `This diagram contains ${edgeCount} directed relationships.`,
    risks: ["Confirm permission checks", "Review async failure paths"],
    nextActions: ["Add retry branch", "Add audit logging"]
  };
}

export function estimateCredits(value: string, action: "generate" | "edit") {
  const base = action === "generate" ? 4 : 2;
  return Math.max(base, Math.ceil(value.length / 120) + base);
}

function shorten(value: string) {
  return value.length > 42 ? `${value.slice(0, 39)}...` : value;
}
