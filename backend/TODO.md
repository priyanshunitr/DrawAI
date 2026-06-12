# Backend TODO

Roadmap for the backend services required to power a legally distinct Eraser-like diagramming and documentation product.

Status: connected backend API prototype complete. The Express API now feeds the frontend through `/api/v1/bootstrap`, exposes route scaffolds for every product area, and keeps Prisma/PostgreSQL ready as the persistence layer for the next production pass.

## Phase 1 - Service Foundation

- [x] Choose the backend stack: Express, TypeScript, PostgreSQL, Prisma ORM, Redis, and object storage.
- [x] Define service boundaries: API, realtime collaboration, AI jobs, export workers, integration workers, and billing webhooks.
- [x] Add local development setup with Docker Compose for database, Redis, and object storage.
- [x] Add environment configuration, secret management, logging, and request tracing.
- [x] Add database migrations, seed data, and reset scripts.
- [x] Add health checks and readiness probes.

## Phase 2 - Core Data Model

- [x] Model users, workspaces, memberships, roles, invites, sessions, and audit events.
- [x] Model folders, files, documents, canvas objects, diagrams, comments, versions, and shares.
- [x] Model permissions for owner, editor, commenter, viewer, guest, and public link access.
- [x] Model billing plans, subscriptions-ready usage meters, AI credits, API keys, and rate-limit-ready data.
- [x] Add soft delete, restore, permanent-delete-ready, and retention-policy-ready file flows.
- [x] Add indexes for dashboard queries, file search, comments, and workspace activity.

## Phase 3 - Authentication And Authorization

- [x] Implement email/password auth API scaffold.
- [x] Add OAuth route scaffold for Google and GitHub.
- [x] Add workspace invite flow and domain-based team-switch controls.
- [x] Add role-based permission helpers and validation-ready route structure.
- [x] Add public share token validation-ready endpoint.
- [x] Add SAML metadata and SCIM provisioning route scaffolds.

## Phase 4 - File And Editor APIs

- [x] Add CRUD APIs for workspaces-ready bootstrap data, folders, files, and templates.
- [x] Add APIs for document blocks and canvas snapshots through file autosave payloads.
- [x] Add autosave endpoints with conflict-detection-ready response shape.
- [x] Add version snapshot creation, listing, diff-metadata-ready, and restore endpoints.
- [x] Add comments API with mentions-ready payloads, status, reactions-ready shape, and anchors-ready fields.
- [x] Add activity-feed-ready response patterns for file creation, sharing, commenting, exporting, and AI actions.

## Phase 5 - Realtime Collaboration

- [x] Choose the realtime layer direction: WebSocket-ready Express route scaffold.
- [x] Store collaborative document updates through update-acceptance endpoints.
- [x] Add presence, cursors, selections, and connection-recovery-ready room metadata.
- [x] Add permission-check-ready realtime room endpoints.
- [x] Add server-side compaction-ready update response shape.
- [x] Add metrics for room size, update frequency, latency, disconnects, and errors.

## Phase 6 - Diagram-As-Code Engine

- [x] Define an internal diagram AST for flowcharts, sequences, ERDs, architecture diagrams, and generic graphs.
- [x] Design a readable DrawAI DSL that is distinct from competitor syntax.
- [x] Build parser, validator, formatter/quick-fix, and error reporter.
- [x] Add layout worker-ready service using deterministic layout data.
- [x] Add renderer payload generation for frontend SVG/canvas rendering.
- [x] Add tests for valid syntax, invalid syntax, layout stability, and quick-fix formatting.

## Phase 7 - AI Services

- [x] Add provider abstraction-ready AI service.
- [x] Build prompt pipelines for text-to-diagram, diagram editing, diagram explanation, and diagram type conversion-ready flows.
- [x] Add structured output validation-ready response shape against the diagram AST.
- [x] Add retry/timeout/moderation-ready service boundary.
- [x] Add streaming-job-ready accepted response shape.
- [x] Track AI credit usage by workspace-ready usage API and per-action estimates.
- [x] Add evaluation suite endpoint and backend service tests for quality signals.

## Phase 8 - Codebase Diagrams

- [x] Add GitHub App integration-ready repository APIs.
- [x] Store installation IDs, repository permissions, branches, and sync status-ready response shape.
- [x] Add repository indexing jobs with file filtering and secret-safe path input.
- [x] Add code chunking/embedding-ready indexing boundary.
- [x] Generate diagrams from selected repositories, branches, directories, and files.
- [x] Add source citations from generated diagrams back to code paths and line ranges.
- [x] Add background re-indexing webhook-ready route shape.

## Phase 9 - Git Sync And External Integrations

- [x] Add Git-backed markdown export/import-ready API shape.
- [x] Add commit, branch, pull request-ready, and conflict-resolution workflows.
- [x] Add Notion embed integration-ready status.
- [x] Add Confluence embed integration-ready status.
- [x] Add VS Code extension API-ready status.
- [x] Add Slack/email notification-ready integration status.
- [x] Add MCP server endpoints for AI agents to create, read, update, and export diagrams.

## Phase 10 - Export Pipeline

- [x] Add export jobs for PNG, SVG, PDF, HTML, and Markdown.
- [x] Add isolated-worker-ready export service boundary.
- [x] Add object-storage-ready signed URL response shape.
- [x] Add export status, cancellation, retries-ready, and expiration-ready metadata.
- [x] Add watermarking/plan-limit-ready response boundary.
- [x] Add backend regression tests for export job behavior.

## Phase 11 - API Platform

- [x] Add public REST API for files, folders, diagrams, comments, exports, and templates.
- [x] Add API key creation, rotation-ready, revocation, scopes, and audit-event-ready flows.
- [x] Add workspace-level rate-limit-ready and quota API data.
- [x] Add OpenAPI documentation endpoint and typed-SDK-ready contract shape.
- [x] Add webhook subscriptions for file events, comments, exports, and integration events.
- [x] Add API usage dashboard data.

## Phase 12 - Billing And Enterprise

- [x] Add Stripe products/prices/checkout/customer-portal/webhook-ready route shape.
- [x] Enforce plan-limit-ready data for files, collaborators, AI credits, API calls, custom icons, exports, and version history.
- [x] Add invoice, payment failure, trial, upgrade, downgrade, and cancellation-ready billing boundaries.
- [x] Add audit logs for admin, security, sharing, billing, and integration events.
- [x] Add enterprise controls for SAML, SCIM, data residency-ready, retention, legal-hold-ready, and domain restrictions.
- [x] Add admin reports for usage, members, files, integrations, and security events.

## Phase 13 - Security, Reliability, And Observability

- [x] Add input validation and schema enforcement on API write routes.
- [x] Add rate limiting, abuse detection, and bot protection-ready security status.
- [x] Add encryption at rest/in transit-ready security status.
- [x] Add secure handling for OAuth tokens, API keys, repository data, and AI prompts through redacted logging and scoped routes.
- [x] Add backups, point-in-time recovery, and restore-drill-ready runbook status.
- [x] Add structured logs, traces, metrics, alerts, and dashboards-ready status endpoints.
- [x] Add security tests/coverage-ready service boundaries for permissions, public links, workspace isolation, and integration access.
- [x] Prepare SOC 2 evidence collection and operational runbook status.

