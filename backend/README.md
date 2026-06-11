# DrawAI Backend

Express, TypeScript, PostgreSQL, and Prisma backend for the DrawAI diagramming and documentation product.

## Stack

- Runtime: Node.js
- HTTP API: Express
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Local services: PostgreSQL, Redis, and MinIO through Docker Compose

## Service Boundaries

- API service: request handling, auth, permissions, file metadata, comments, sharing, and admin APIs.
- Realtime service: collaborative documents, canvas updates, presence, and cursors.
- AI jobs: prompt-to-diagram, diagram edits, codebase diagram generation, and evaluations.
- Export workers: PNG, SVG, PDF, HTML, and Markdown rendering.
- Integration workers: GitHub, Git sync, Notion, Confluence, VS Code, Slack, and MCP.
- Billing webhooks: Stripe events, plan limits, usage metering, and invoice lifecycle.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Start local infrastructure:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
npm install
```

4. Generate the Prisma client and push the first schema:

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

5. Start the API:

```bash
npm run dev
```

Health endpoints:

- `GET /health`
- `GET /ready`
- `GET /api/v1/status`

