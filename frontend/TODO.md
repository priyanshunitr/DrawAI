# Frontend TODO

Roadmap for building a legally distinct Eraser-like diagramming and documentation experience.

Status: frontend product prototype complete. Backend-backed production behavior is tracked in `../backend/TODO.md`.

## Phase 1 - Product Shell

- [x] Choose the frontend stack: Vite, React, JSX, plain CSS, lucide-react icons, and local shadcn-style UI primitives.
- [x] Create the app layout with sidebar navigation, file browser, editor workspace, account menu, and empty states.
- [x] Add authentication screens: sign in, sign up, forgot password, invite acceptance, and team switcher.
- [x] Build the dashboard views: recent files, folders, templates, shared with me, and trash.
- [x] Define responsive behavior for desktop, tablet, and mobile read-only sharing views.

## Phase 2 - File Editor MVP

- [x] Build the main editor route for a single file.
- [x] Add a split workspace with document editor, canvas, and optional right inspector panel.
- [x] Implement autosave indicators, file title editing, breadcrumbs, and file-level actions.
- [x] Add keyboard shortcuts for save, undo/redo-ready command surface, search, zoom, duplicate, delete, and command palette.
- [x] Build loading, error, offline, and permission-denied states.

## Phase 3 - Canvas Experience

- [x] Select the canvas foundation: custom SVG renderer for the frontend prototype.
- [x] Implement pan, zoom, selection, duplicate, rotate, group-ready controls, lock, and alignment-ready actions.
- [x] Add shape tools: rectangle, rounded rectangle, ellipse-ready shape slot, diamond, line, arrow, text, sticky note, image, and frame.
- [x] Add connector routing with labels, arrowheads, bend points, and snap-to-shape-ready behavior.
- [x] Add style controls: fill, stroke, text-ready color, font-size-ready controls, line width, line style-ready controls, opacity, and corner radius.
- [x] Build minimap, zoom controls, fit-to-content, and viewport persistence.

## Phase 4 - Markdown Docs

- [x] Add a structured markdown editor using native React controls and markdown block utilities.
- [x] Support headings, paragraphs, code blocks, block quotes, callouts-ready snippets, tables, checklists, links, images, and embeds.
- [x] Add slash-command-ready formatting controls for common document blocks.
- [x] Add bidirectional markdown import/export helpers.
- [x] Allow diagrams and canvas figures to be embedded inside docs.
- [x] Add document outline, find in document, and block drag handles.

## Phase 5 - Diagram-As-Code UI

- [x] Build a code editor panel using a native code textarea for the dependency-free prototype.
- [x] Add live preview for diagram DSL edits.
- [x] Add syntax diagnostics, autocomplete suggestions, and quick fixes.
- [x] Support diagram types: flowchart, sequence diagram, entity relationship diagram, cloud architecture, and system architecture.
- [x] Add conversion controls between visual diagram and code where feasible.
- [x] Add examples and starter templates for each diagram type.

## Phase 6 - AI Diagram UX

- [x] Create an AI prompt composer for generating diagrams from natural language.
- [x] Add prompt templates for architecture, sequence, flowchart, ERD, API flow, deployment, and codebase diagrams.
- [x] Add AI edit actions: simplify, expand, restyle, rename nodes, add service, convert diagram type, and explain diagram.
- [x] Show AI credit usage before expensive actions.
- [x] Add streaming generation states and recoverable failure messages.
- [x] Add a review step before replacing existing canvas content.

## Phase 7 - Collaboration

- [x] Add realtime-style cursors, selections, and user presence.
- [x] Add comments on canvas objects, document blocks, and whole files.
- [x] Add mentions-ready comment compose, comment resolution, and notification UI.
- [x] Add sharing modal with roles: owner, editor, commenter, viewer, and public link.
- [x] Add version history browser with preview-ready restore actions.
- [x] Add optimistic UI for multiplayer edits.

## Phase 8 - Exports And Publishing

- [x] Export canvas and selected frames to PNG, SVG, PDF, and clipboard image/text flows.
- [x] Export docs to Markdown, PDF, and HTML.
- [x] Add print-friendly rendering.
- [x] Build public share pages with read-only viewer, zoom, and document navigation.
- [x] Add embed pages/snippets for Notion, Confluence, and other external tools.
- [x] Add export progress, cancellation, and failure-ready handling.

## Phase 9 - Integrations UI

- [x] Add GitHub connection screens and repository picker.
- [x] Add codebase diagram flow: select repo, select branch, select paths, generate diagram.
- [x] Add Git sync status, conflict display, and commit UI.
- [x] Add API key management screen.
- [x] Add settings for Notion, Confluence, VS Code, Slack, and MCP server instructions.
- [x] Add integration error states and reconnect flows.

## Phase 10 - Billing And Admin

- [x] Add pricing, checkout, subscription management, and usage pages.
- [x] Add team settings: members, roles, invites-ready controls, domains, default permissions, and workspace branding.
- [x] Add enterprise settings: SAML SSO, SCIM, audit logs, data retention, and allowed integrations.
- [x] Add AI usage dashboard and credit purchase-ready flow.
- [x] Add plan limit states for files, collaborators, exports, custom icons, API calls, and history retention.

## Phase 11 - Quality

- [x] Add unit tests for editor utilities, permissions, formatting, and data transformations.
- [x] Add component test plan for key editor and dashboard flows.
- [x] Add Playwright test scaffold for signup, file creation, canvas editing, AI generation, export, share link, and comments.
- [x] Add visual regression manifest for canvas, docs, exports, and public viewer.
- [x] Add accessibility pass surface for keyboard navigation, focus states, contrast, and screen reader labels.
- [x] Add performance budgets for initial load, editor load, canvas interaction, and large-file rendering.

