# Backend TODO

Roadmap for the backend services required to power a legally distinct Eraser-like diagramming and documentation product.

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
- [ ] Model billing plans, subscriptions, usage meters, AI credits, API keys, and rate limits.
- [ ] Add soft delete, restore, permanent delete, and retention policies.
- [x] Add indexes for dashboard queries, file search, comments, and workspace activity.

## Phase 3 - Authentication And Authorization

- [ ] Implement email/password auth or integrate a provider such as Clerk/Auth.js/Auth0.
- [ ] Add OAuth support for Google and GitHub login.
- [ ] Add workspace invite flow and domain-based join controls.
- [ ] Add role-based access control middleware.
- [ ] Add public share token validation.
- [ ] Add SAML SSO and SCIM provisioning for enterprise phase.

## Phase 4 - File And Editor APIs

- [ ] Add CRUD APIs for workspaces, folders, files, and templates.
- [ ] Add APIs for document blocks and canvas snapshots.
- [ ] Add autosave endpoints with conflict detection.
- [ ] Add version snapshot creation, listing, diff metadata, and restore.
- [ ] Add comments API with mentions, status, reactions, and anchors.
- [ ] Add activity feed events for file creation, sharing, commenting, exporting, and AI actions.

## Phase 5 - Realtime Collaboration

- [ ] Choose the realtime layer: Yjs/Hocuspocus, Liveblocks, Socket.IO, or WebSocket service.
- [ ] Store collaborative document updates durably.
- [ ] Add presence, cursors, selections, and connection recovery.
- [ ] Add permission checks for realtime rooms.
- [ ] Add server-side compaction of collaboration updates into snapshots.
- [ ] Add metrics for room size, update frequency, latency, disconnects, and errors.

## Phase 6 - Diagram-As-Code Engine

- [ ] Define an internal diagram AST that can represent flowcharts, sequences, ERDs, architecture diagrams, and generic graphs.
- [ ] Design a readable DSL that is distinct from competitors' syntax.
- [ ] Build parser, validator, formatter, and error reporter.
- [ ] Add layout workers using ELK.js, Dagre, Graphviz, or a hybrid layout system.
- [ ] Add renderer payload generation for frontend SVG/canvas rendering.
- [ ] Add tests for valid syntax, invalid syntax, layout stability, and round-trip formatting.

## Phase 7 - AI Services

- [ ] Add provider abstraction for OpenAI and optional fallback providers.
- [ ] Build prompt pipelines for text-to-diagram, diagram editing, diagram explanation, and diagram type conversion.
- [ ] Add structured output validation against the diagram AST.
- [ ] Add retry, timeout, moderation, and safety handling.
- [ ] Add streaming job updates over WebSocket or server-sent events.
- [ ] Track AI credit usage by workspace, user, model, action type, and file.
- [ ] Add evaluation suite for prompt quality, syntax validity, render success, and latency.

## Phase 8 - Codebase Diagrams

- [ ] Add GitHub App integration for repository access.
- [ ] Store installation IDs, repository permissions, branches, and sync status.
- [ ] Add repository indexing jobs with file filtering, language detection, and secret-safe exclusions.
- [ ] Chunk code, create embeddings, and store searchable code context.
- [ ] Generate diagrams from selected repositories, branches, directories, and files.
- [ ] Add source citations from generated diagrams back to code paths and line ranges.
- [ ] Add background re-indexing on webhook events.

## Phase 9 - Git Sync And External Integrations

- [ ] Add Git-backed markdown export/import.
- [ ] Add commit, branch, pull request, and conflict-resolution workflows.
- [ ] Add Notion embed integration.
- [ ] Add Confluence embed integration.
- [ ] Add VS Code extension API endpoints.
- [ ] Add Slack or email notifications for mentions and comments.
- [ ] Add MCP server endpoints for AI agents to create, read, update, and export diagrams.

## Phase 10 - Export Pipeline

- [ ] Add export jobs for PNG, SVG, PDF, HTML, and Markdown.
- [ ] Use isolated workers for browser-based rendering when needed.
- [ ] Store generated exports in object storage with signed URLs.
- [ ] Add export status, cancellation, retries, and expiration.
- [ ] Add watermarking or plan-based export restrictions if needed.
- [ ] Add regression tests for export fidelity.

## Phase 11 - API Platform

- [ ] Add public REST API for files, folders, diagrams, comments, exports, and templates.
- [ ] Add API key creation, rotation, revocation, scopes, and audit events.
- [ ] Add workspace-level rate limits and quota enforcement.
- [ ] Add OpenAPI documentation and typed SDK generation.
- [ ] Add webhook subscriptions for file events, comments, exports, and integration events.
- [ ] Add API usage dashboard data.

## Phase 12 - Billing And Enterprise

- [ ] Integrate Stripe products, prices, checkout, customer portal, and webhooks.
- [ ] Enforce plan limits for files, collaborators, AI credits, API calls, custom icons, exports, and version history.
- [ ] Add invoice, payment failure, trial, upgrade, downgrade, and cancellation flows.
- [ ] Add audit logs for admin, security, sharing, billing, and integration events.
- [ ] Add enterprise controls for SAML, SCIM, data residency, retention, legal hold, and domain restrictions.
- [ ] Add admin reports for usage, members, files, integrations, and security events.

## Phase 13 - Security, Reliability, And Observability

- [ ] Add input validation and schema enforcement on every API.
- [ ] Add rate limiting, abuse detection, and bot protection.
- [ ] Add encryption at rest and in transit.
- [ ] Add secure handling for OAuth tokens, API keys, repository data, and AI prompts.
- [ ] Add backups, point-in-time recovery, and restore drills.
- [ ] Add structured logs, traces, metrics, alerts, and dashboards.
- [ ] Add security tests for permissions, public links, workspace isolation, and integration access.
- [ ] Prepare SOC 2 evidence collection and operational runbooks.
