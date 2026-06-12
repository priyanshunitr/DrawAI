export function markdownToBlocks(markdown) {
  return markdown
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("### ")) return { type: "h3", text: line.slice(4) };
      if (line.startsWith("## ")) return { type: "h2", text: line.slice(3) };
      if (line.startsWith("- [ ] ")) return { type: "check", text: line.slice(6) };
      if (line.startsWith("- ")) return { type: "li", text: line.slice(2) };
      if (line.startsWith("> ")) return { type: "quote", text: line.slice(2) };
      if (line.startsWith("```")) return { type: "code", text: line.replaceAll("`", "") };
      return { type: "p", text: line };
    });
}

export function blocksToMarkdown(blocks) {
  return blocks
    .map((block) => {
      if (block.type === "h2") return `## ${block.text}`;
      if (block.type === "h3") return `### ${block.text}`;
      if (block.type === "check") return `- [ ] ${block.text}`;
      if (block.type === "li") return `- ${block.text}`;
      if (block.type === "quote") return `> ${block.text}`;
      if (block.type === "code") return `\`\`\`\n${block.text}\n\`\`\``;
      return block.text;
    })
    .join("\n");
}

export function buildMarkdownExport({ title, markdown, diagramDsl }) {
  return `# ${title}\n\n${markdown}\n\n## Diagram source\n\n\`\`\`drawai\n${diagramDsl}\n\`\`\`\n`;
}

export function buildHtmlExport({ title, markdown }) {
  const escaped = escapeHtml(markdown);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <pre>${escaped}</pre>
    </main>
  </body>
</html>`;
}

export function estimateAiCredits(prompt, action = "generate") {
  const base = action === "generate" ? 4 : 2;
  return Math.max(base, Math.ceil(prompt.trim().length / 120) + base);
}

export function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
