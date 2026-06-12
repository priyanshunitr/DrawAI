# Frontend TODO

Roadmap for building a legally distinct Eraser-like diagramming and documentation experience.

## Phase 1 - Product Shell

- [x] Choose the frontend stack: Vite, React, JSX, plain CSS, and lucide-react icons.
- [x] Create the app layout with sidebar navigation, file browser, editor workspace, account menu, and empty states.
- [ ] Add authentication screens: sign in, sign up, forgot password, invite acceptance, and team switcher.
- [ ] Build the dashboard views: recent files, folders, templates, shared with me, and trash.
- [x] Define responsive behavior for desktop, tablet, and mobile read-only sharing views.

## Phase 2 - File Editor MVP

- [ ] Build the main editor route for a single file.
- [x] Add a split workspace with document editor, canvas, and optional right inspector panel.
- [ ] Implement autosave indicators, file title editing, breadcrumbs, and file-level actions.
- [ ] Add keyboard shortcuts for save, undo, redo, search, zoom, duplicate, delete, and command palette.
- [ ] Build loading, error, offline, and permission-denied states.

## Phase 3 - Canvas Experience

- [ ] Select the canvas foundation: tldraw, React Flow, Excalidraw-style custom canvas, or a custom SVG/canvas renderer.
- [ ] Implement pan, zoom, selection, drag, resize, rotate, duplicate, group, lock, and alignment guides.
- [ ] Add shape tools: rectangle, rounded rectangle, ellipse, diamond, line, arrow, text, sticky note, image, and frame.
- [ ] Add connector routing with labels, arrowheads, bend points, and snap-to-shape behavior.
- [ ] Add style controls: fill, stroke, text color, font size, line width, line style, opacity, and corner radius.
- [ ] Build minimap, zoom controls, fit-to-content, and viewport persistence.

## Phase 4 - Markdown Docs

- [ ] Add a rich markdown editor using Tiptap/ProseMirror or another structured editor.
- [ ] Support headings, paragraphs, code blocks, block quotes, callouts, tables, checklists, links, images, and embeds.
- [ ] Add slash commands for common document blocks.
- [ ] Add bidirectional markdown import/export.
- [ ] Allow diagrams and canvas figures to be embedded inside docs.
- [ ] Add document outline, find in document, and block drag handles.

## Phase 5 - Diagram-As-Code UI

- [ ] Build a code editor panel using Monaco or CodeMirror.
- [ ] Add live preview for diagram DSL edits.
- [ ] Add syntax highlighting, lint errors, autocomplete, and quick fixes.
- [ ] Support diagram types: flowchart, sequence diagram, entity relationship diagram, cloud architecture, and system architecture.
- [ ] Add conversion controls between visual diagram and code where feasible.
- [ ] Add examples and starter templates for each diagram type.

## Phase 6 - AI Diagram UX

- [ ] Create an AI prompt composer for generating diagrams from natural language.
- [ ] Add prompt templates for architecture, sequence, flowchart, ERD, API flow, deployment, and codebase diagrams.
- [ ] Add AI edit actions: simplify, expand, restyle, rename nodes, add service, convert diagram type, and explain diagram.
- [ ] Show AI credit usage before expensive actions.
- [ ] Add streaming generation states and recoverable failure messages.
- [ ] Add a review step before replacing existing canvas content.

## Phase 7 - Collaboration

- [ ] Add realtime cursors, selections, and user presence.
- [ ] Add comments on canvas objects, document blocks, and whole files.
- [ ] Add mentions, comment resolution, and notification UI.
- [ ] Add sharing modal with roles: owner, editor, commenter, viewer, and public link.
- [ ] Add version history browser with preview and restore.
- [ ] Add optimistic UI for multiplayer edits.

## Phase 8 - Exports And Publishing

- [ ] Export canvas and selected frames to PNG, SVG, PDF, and clipboard image.
- [ ] Export docs to Markdown, PDF, and HTML.
- [ ] Add print-friendly rendering.
- [ ] Build public share pages with read-only viewer, zoom, and document navigation.
- [ ] Add embed pages for Notion, Confluence, and other external tools.
- [ ] Add export progress, cancellation, and failure handling.

## Phase 9 - Integrations UI

- [ ] Add GitHub connection screens and repository picker.
- [ ] Add codebase diagram flow: select repo, select branch, select paths, generate diagram.
- [ ] Add Git sync status, conflict display, and commit UI.
- [ ] Add API key management screen.
- [ ] Add settings for Notion, Confluence, VS Code, Slack, and MCP server instructions.
- [ ] Add integration error states and reconnect flows.

## Phase 10 - Billing And Admin

- [ ] Add pricing, checkout, subscription management, and usage pages.
- [ ] Add team settings: members, roles, invites, domains, default permissions, and workspace branding.
- [ ] Add enterprise settings: SAML SSO, SCIM, audit logs, data retention, and allowed integrations.
- [ ] Add AI usage dashboard and credit purchase flow.
- [ ] Add plan limit states for files, collaborators, exports, custom icons, API calls, and history retention.

## Phase 11 - Quality

- [ ] Add unit tests for editor utilities, permissions, formatting, and data transformations.
- [ ] Add component tests for key editor and dashboard flows.
- [ ] Add Playwright tests for signup, file creation, canvas editing, AI generation, export, share link, and comments.
- [ ] Add visual regression tests for canvas, docs, exports, and public viewer.
- [ ] Add accessibility pass for keyboard navigation, focus states, contrast, and screen reader labels.
- [ ] Add performance budgets for initial load, editor load, canvas interaction, and large-file rendering.
