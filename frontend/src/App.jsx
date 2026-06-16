import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  Bell,
  Bot,
  Box,
  Braces,
  Check,
  ChevronDown,
  Clipboard,
  Cloud,
  Code2,
  Command,
  Copy,
  CreditCard,
  Diamond,
  Download,
  Edit3,
  Eye,
  FileCode2,
  FileImage,
  FileText,
  Folder,
  GitBranch,
  Globe2,
  History,
  Image,
  KeyRound,
  LayoutDashboard,
  Link,
  Loader2,
  Lock,
  MessageSquare,
  Minus,
  MousePointer2,
  PanelRight,
  PenLine,
  Plus,
  RefreshCw,
  RotateCw,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Square,
  StickyNote,
  Table2,
  Trash2,
  TriangleAlert,
  Users,
  Wand2,
  Workflow,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import {
  apiKeys as fallbackApiKeys,
  comments as fallbackComments,
  files as fallbackFiles,
  folders as fallbackFolders,
  integrations as fallbackIntegrations,
  plans as fallbackPlans,
  teamMembers as fallbackTeamMembers,
  templates as fallbackTemplates,
  usage as fallbackUsage,
  versions as fallbackVersions,
  workspace as fallbackWorkspace
} from "./data/workspace.js";
import {
  diagramExamples,
  diagramLayout,
  parseDiagramDsl,
  quickFixDiagramDsl
} from "./lib/diagram.js";
import {
  blocksToMarkdown,
  buildHtmlExport,
  buildMarkdownExport,
  estimateAiCredits,
  markdownToBlocks
} from "./lib/editor.js";
import {
  createComment,
  createExport,
  createFile as createFileRequest,
  createShare,
  deleteFile as deleteFileRequest,
  fetchBootstrap,
  generateDiagram,
  resolveComment as resolveCommentRequest,
  restoreFile as restoreFileRequest,
  saveFile,
  updateFile as updateFileRequest
} from "./lib/api.js";
import { can, createShareToken, getRoleLabel } from "./lib/permissions.js";
import "./App.css";

const fallbackData = {
  workspace: fallbackWorkspace,
  files: fallbackFiles,
  folders: fallbackFolders,
  templates: fallbackTemplates,
  teamMembers: fallbackTeamMembers,
  comments: fallbackComments,
  versions: fallbackVersions,
  integrations: fallbackIntegrations,
  apiKeys: fallbackApiKeys,
  plans: fallbackPlans,
  usage: fallbackUsage
};

const DataContext = createContext(fallbackData);

function useData() {
  return useContext(DataContext);
}

const defaultMarkdown = `## Authentication flow
The client exchanges credentials with the API gateway, then stores a short-lived session token after workspace membership checks pass.

### Services
- API gateway validates incoming requests.
- Auth service owns sessions and invite acceptance.
- Workspace service resolves roles and file permissions.

> Review token refresh before enabling public embeds.

- [ ] Add billing webhook failure branch`;

const shapeTools = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "rect", label: "Rectangle", icon: Square },
  { id: "round", label: "Rounded", icon: Box },
  { id: "diamond", label: "Diamond", icon: Diamond },
  { id: "line", label: "Line", icon: Minus },
  { id: "arrow", label: "Arrow", icon: Send },
  { id: "text", label: "Text", icon: FileText },
  { id: "note", label: "Sticky", icon: StickyNote },
  { id: "image", label: "Image", icon: Image },
  { id: "frame", label: "Frame", icon: PanelRight }
];

const diagramTypes = ["flowchart", "sequence", "erd", "architecture", "system"];
const exportFormats = ["PNG", "SVG", "PDF", "Clipboard", "Markdown", "HTML"];
const aiTemplates = ["Architecture", "Sequence", "Flowchart", "ERD", "API flow", "Deployment", "Codebase"];
const aiActions = ["Simplify", "Expand", "Restyle", "Rename nodes", "Add service", "Convert type", "Explain"];
const editorStates = ["Normal", "Loading", "Offline", "Permission denied", "Error"];
const workspaceStorageKey = "drawai:workspace";

function slugify(value) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || `file-${Date.now()}`;
}

function readJsonStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is best effort.
  }
}

function createLocalFileRecord({ title, kind = "Flowchart", folder = "Unsorted", markdown = "## New file", diagramDsl = diagramExamples.flowchart }) {
  return {
    id: `${slugify(title)}-${Date.now().toString(36)}`,
    title,
    folder,
    kind,
    owner: "Founder",
    updated: "Just now",
    created: "Just now",
    status: "active",
    shared: false,
    markdown,
    diagramDsl
  };
}

function fileDateLabel(file, fallback = "Just now") {
  return file.created ?? file.updated ?? fallback;
}

function createDefaultFlowNodes() {
  return [
    { id: "recording", label: "Recording starts", kind: "oval", icon: "mic", x: 50, y: 210, w: 170, h: 88 },
    { id: "create", label: "Create recording", kind: "rect", icon: "file", x: 335, y: 210, w: 170, h: 88 },
    { id: "request", label: "Request upload\nURL", kind: "oval", icon: "link", x: 575, y: 203, w: 180, h: 102 },
    { id: "signed", label: "Generate signed\nS3 URL", kind: "oval", icon: "cloud", x: 820, y: 203, w: 190, h: 102 },
    { id: "upload", label: "Upload audio to\nS3", kind: "oval", icon: "upload", x: 1070, y: 203, w: 190, h: 102 },
    { id: "complete", label: "Upload complete\nAPI", kind: "oval", icon: "check", x: 1320, y: 203, w: 190, h: 102 },
    { id: "db", label: "Mark ready in\nDB", kind: "oval", icon: "db", x: 1570, y: 203, w: 190, h: 102 },
    { id: "job", label: "Add embedRe\ncording job", kind: "white", icon: "task", x: 210, y: 595, w: 170, h: 102 },
    { id: "worker", label: "Worker picks\nrecording", kind: "oval", icon: "play", x: 230, y: 810, w: 190, h: 102 },
    { id: "transcribe", label: "Generate\ntranscript", kind: "oval", icon: "send", x: 500, y: 835, w: 190, h: 102 },
    { id: "embed", label: "Create\nembeddings", kind: "oval", icon: "spark", x: 760, y: 835, w: 190, h: 102 },
    { id: "store", label: "Store chunks\nand vectors", kind: "oval", icon: "db", x: 1030, y: 800, w: 190, h: 102 },
    { id: "ready", label: "Ready for chat", kind: "olive", icon: "chat", x: 1530, y: 810, w: 190, h: 102 }
  ];
}

function createFlowDslFromNodes(nodes) {
  const labels = nodes.map((node) => node.label.replace(/\n/g, " "));
  const edges = labels.slice(0, -1).map((label, index) => `${label} -> ${labels[index + 1]}: next`);
  return `diagram flowchart\n${edges.join("\n")}`;
}

function buildFlowSvg(nodes, title = "Flowchart") {
  const text = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const nodeMarkup = nodes.map((node) => {
    const rx = node.kind === "rect" ? 8 : 48;
    const fill = node.kind === "olive" ? "#5b5c2c" : node.kind === "white" ? "#202020" : "#242a31";
    const stroke = node.kind === "olive" ? "#e3ef8c" : node.kind === "white" ? "#f0f0f0" : "#60ef80";
    const lines = node.label.split("\n").map((line, index) => (
      `<text x="${node.x + node.w / 2}" y="${node.y + node.h / 2 + (index * 22) - ((node.label.split("\n").length - 1) * 11)}" text-anchor="middle">${text(line)}</text>`
    )).join("");
    return `<g><rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${lines}</g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1900" height="1080" viewBox="0 0 1900 1080">
<rect width="1900" height="1080" fill="#151515"/>
<text x="16" y="28" fill="#fff" font-family="Arial" font-size="18">${text(title)}</text>
<rect x="0" y="30" width="1810" height="880" rx="5" fill="none" stroke="#74f487" stroke-width="2"/>
<rect x="294" y="98" width="1485" height="198" rx="10" fill="#303b4b" fill-opacity="0.78" stroke="#3479f5" stroke-width="2"/>
<rect x="170" y="455" width="1010" height="430" rx="10" fill="#234242" fill-opacity="0.68" stroke="#66f3f0" stroke-width="2"/>
<g fill="#fff" font-family="Arial" font-size="18">${nodeMarkup}</g>
</svg>`;
}

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace("#/", "") || "dashboard");

  useEffect(() => {
    const sync = () => setRoute(window.location.hash.replace("#/", "") || "dashboard");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function navigate(nextRoute) {
    window.location.hash = `/${nextRoute}`;
  }

  return [route, navigate];
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function IconButton({ label, children, active = false, onClick }) {
  return (
    <button
      className={active ? "icon-button is-active" : "icon-button"}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ActionButton({ children, tone = "default", onClick, disabled = false }) {
  return (
    <button className={`action-button action-${tone}`} type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function SectionHeader({ eyebrow, title, actions }) {
  return (
    <header className="section-header">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}

function App() {
  const [route, navigate] = useHashRoute();
  const [data, setData] = useState(() => ({ ...fallbackData, ...readJsonStorage(workspaceStorageKey, {}) }));
  const [apiStatus, setApiStatus] = useState("local");
  const [activeFileId, setActiveFileId] = useState("auth-architecture");
  const page = route.split("/")[0];
  const routeFileId = route.split("/")[1];
  const currentFileId = (page === "editor" || page === "share") && routeFileId ? routeFileId : activeFileId;
  const activeFile = data.files.find((file) => file.id === currentFileId) ?? data.files[0];
  const activeFileCount = data.files.filter((file) => file.status !== "trash").length;

  function setWorkspaceData(updater) {
    setData((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      writeJsonStorage(workspaceStorageKey, next);
      return next;
    });
  }

  useEffect(() => {
    const controller = new AbortController();

    fetchBootstrap({ signal: controller.signal })
      .then((nextData) => {
        const storedData = readJsonStorage(workspaceStorageKey, null);
        setWorkspaceData({ ...fallbackData, ...nextData, ...(storedData ?? {}) });
        setApiStatus("connected");
      })
      .catch(() => setApiStatus("local"));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if ((page === "editor" || page === "share") && routeFileId) {
      setActiveFileId(routeFileId);
    }
  }, [page, routeFileId]);

  function openFile(fileId) {
    setActiveFileId(fileId);
    navigate(`editor/${fileId}`);
  }

  function createWorkspaceFile(input = {}) {
    const file = createLocalFileRecord(input);
    setWorkspaceData((current) => ({ ...current, files: [file, ...current.files] }));
    createFileRequest({ title: file.title, kind: file.kind, folder: file.folder }).catch(() => undefined);
    openFile(file.id);
    return file;
  }

  function updateWorkspaceFile(fileId, patch) {
    setWorkspaceData((current) => ({
      ...current,
      files: current.files.map((item) => item.id === fileId ? { ...item, ...patch, updated: "Just now" } : item)
    }));
    updateFileRequest(fileId, patch).catch(() => undefined);
  }

  function moveFileToTrash(fileId) {
    setWorkspaceData((current) => ({
      ...current,
      files: current.files.map((item) => item.id === fileId ? { ...item, status: "trash", updated: "Just now" } : item)
    }));
    deleteFileRequest(fileId).catch(() => undefined);
  }

  function restoreWorkspaceFile(fileId) {
    setWorkspaceData((current) => ({
      ...current,
      files: current.files.map((item) => item.id === fileId ? { ...item, status: "active", updated: "Just now" } : item)
    }));
    restoreFileRequest(fileId).catch(() => undefined);
  }

  if (page === "editor") {
    return (
      <DataContext.Provider value={data}>
        <EditorView file={activeFile} updateWorkspaceFile={updateWorkspaceFile} />
      </DataContext.Provider>
    );
  }

  return (
    <DataContext.Provider value={data}>
    <main className="app-shell eraser-shell">
      <aside className="sidebar eraser-sidebar" aria-label="Workspace navigation">
        {page !== "editor" ? (
          <>
            <div>
              <button className="eraser-brand-row" type="button" onClick={() => navigate("dashboard")}>
                <span className="eraser-brand-mark" aria-hidden="true">
                  <span />
                  <span />
                </span>
                <strong>Priyanshu's Team</strong>
                <ChevronDown size={13} strokeWidth={3} />
              </button>

              <nav className="eraser-primary-nav" aria-label="Files">
                <button className="eraser-nav-item is-active" type="button" onClick={() => navigate("dashboard")}>
                  <LayoutDashboard size={14} strokeWidth={3} />
                  <span>All Files</span>
                  <kbd>A</kbd>
                </button>
              </nav>

              <div className="eraser-folder-title">
                <span>Team Folders</span>
                <Folder size={15} />
              </div>

              <section className="eraser-trial-card" aria-label="Free trial usage">
                <strong>Eraser Free Trial</strong>
                <progress value={Math.min(activeFileCount, 3)} max="3" />
                <span>{Math.min(activeFileCount, 3)} of 3 files.</span>
                <p>Upgrade your plan for unlimited files &amp; more features</p>
                <button type="button">Upgrade</button>
              </section>
            </div>

            <div className="eraser-sidebar-bottom">
              <nav className="eraser-secondary-nav" aria-label="Workspace tools">
                <button type="button">
                  <Bot size={14} />
                  <span>Eraserbot</span>
                  <Badge tone="neutral">Beta</Badge>
                  <kbd>B</kbd>
                </button>
                <button type="button">
                  <Sparkles size={14} />
                  <span>AI Presets</span>
                  <kbd>C</kbd>
                </button>
                <button type="button">
                  <Box size={14} />
                  <span>Team Templates</span>
                  <kbd>T</kbd>
                </button>
                <button type="button">
                  <GitBranch size={14} />
                  <span>Github Sync</span>
                  <Badge tone="neutral">Beta</Badge>
                  <kbd>G</kbd>
                </button>
                <button type="button">
                  <Lock size={14} />
                  <span>Private Files</span>
                  <small>Upgrade</small>
                </button>
                <button type="button">
                  <Archive size={14} />
                  <span>Archive</span>
                  <kbd>E</kbd>
                </button>
              </nav>

              <button className="eraser-new-file" type="button" onClick={() => createWorkspaceFile({ title: `Untitled file ${activeFileCount + 1}` })}>
                <span>New File <small>Alt N</small></span>
                <ChevronDown size={12} strokeWidth={3} />
              </button>
            </div>
          </>
        ) : (
          <>
            <button className="brand-row" type="button" onClick={() => navigate("dashboard")}>
              <div className="brand-mark">D</div>
              <span>
                <strong>DrawAI</strong>
                <small>{data.workspace.plan}</small>
              </span>
            </button>
            <Badge tone={apiStatus === "connected" ? "good" : "warn"}>
              API {apiStatus}
            </Badge>

            <button className="new-file-button" type="button" onClick={() => openFile("auth-architecture")}>
              <Plus size={16} />
              New file
            </button>

            <label className="search-box">
              <Search size={16} />
              <input type="search" placeholder="Search files" />
            </label>

            <nav className="nav-list" aria-label="Product areas">
              <NavButton active={page === "dashboard"} icon={LayoutDashboard} label="Dashboard" onClick={() => navigate("dashboard")} />
              <NavButton active={page === "editor"} icon={Workflow} label="Editor" onClick={() => openFile(activeFileId)} />
              <NavButton active={page === "share"} icon={Globe2} label="Public share" onClick={() => navigate("share/auth-architecture")} />
              <NavButton active={page === "integrations"} icon={GitBranch} label="Integrations" onClick={() => navigate("integrations")} />
              <NavButton active={page === "billing"} icon={CreditCard} label="Billing & admin" onClick={() => navigate("billing")} />
              <NavButton active={page === "quality"} icon={ShieldCheck} label="Quality" onClick={() => navigate("quality")} />
              <NavButton active={page === "auth"} icon={Lock} label="Auth screens" onClick={() => navigate("auth")} />
            </nav>

            <div className="sidebar-section">
              <span className="section-label">Recent</span>
              {data.files.filter((file) => file.status === "active").slice(0, 3).map((file) => (
                <button
                  className={file.id === activeFileId ? "file-row is-active" : "file-row"}
                  key={file.id}
                  type="button"
                  onClick={() => openFile(file.id)}
                >
                  <FileText size={16} />
                  <span>
                    <strong>{file.title}</strong>
                    <small>{file.kind}</small>
                  </span>
                </button>
              ))}
            </div>

            <button className="account-menu" type="button" onClick={() => navigate("auth/team")}>
              <Users size={18} />
              <span>
                <strong>{data.workspace.owner}</strong>
                <small>{data.workspace.domain}</small>
              </span>
              <ChevronDown size={14} />
            </button>
          </>
        )}
      </aside>

      <section className="workspace">
        {page === "auth" ? (
          <AuthView route={route} />
        ) : page === "editor" ? (
          <EditorView file={activeFile} updateWorkspaceFile={updateWorkspaceFile} />
        ) : page === "share" ? (
          <PublicShareView file={activeFile} />
        ) : page === "integrations" ? (
          <IntegrationsView />
        ) : page === "billing" ? (
          <BillingAdminView />
        ) : page === "quality" ? (
          <QualityView />
        ) : (
          <DashboardView
            activeFileId={activeFile?.id}
            createWorkspaceFile={createWorkspaceFile}
            moveFileToTrash={moveFileToTrash}
            onOpenFile={openFile}
            restoreWorkspaceFile={restoreWorkspaceFile}
          />
        )}
      </section>
    </main>
    </DataContext.Provider>
  );
}

function NavButton({ active, icon: Icon, label, onClick }) {
  return (
    <button className={active ? "nav-button is-active" : "nav-button"} type="button" onClick={onClick}>
      <Icon size={17} />
      {label}
    </button>
  );
}

function AuthView({ route }) {
  const { workspace } = useData();
  const mode = route.split("/")[1] || "signin";
  const [team, setTeam] = useState(workspace.slug);
  const [message, setMessage] = useState("");

  const authModes = [
    ["signin", "Sign in"],
    ["signup", "Sign up"],
    ["forgot", "Forgot password"],
    ["invite", "Invite"],
    ["team", "Team switcher"]
  ];

  return (
    <div className="screen auth-screen">
      <SectionHeader eyebrow="Access" title="Authentication" />
      <div className="tab-row">
        {authModes.map(([id, label]) => (
          <a className={mode === id ? "tab is-active" : "tab"} href={`#/auth/${id}`} key={id}>
            {label}
          </a>
        ))}
      </div>

      <section className="auth-layout">
        <form className="form-panel" onSubmit={(event) => event.preventDefault()}>
          <h2>{authModes.find(([id]) => id === mode)?.[1] ?? "Sign in"}</h2>
          {mode === "team" ? (
            <>
              <label>
                Workspace
                <select value={team} onChange={(event) => setTeam(event.target.value)}>
                  <option value="drawai-product">DrawAI Product</option>
                  <option value="diagram-lab">Diagram Lab</option>
                  <option value="platform-team">Platform Team</option>
                </select>
              </label>
              <label>
                Role
                <select defaultValue="owner">
                  <option value="owner">{getRoleLabel("owner")}</option>
                  <option value="editor">{getRoleLabel("editor")}</option>
                  <option value="viewer">{getRoleLabel("viewer")}</option>
                </select>
              </label>
            </>
          ) : (
            <>
              {mode === "invite" ? (
                <label>
                  Invite token
                  <input defaultValue="drawai-product.editor.8k2m" />
                </label>
              ) : null}
              {mode !== "forgot" ? (
                <label>
                  Name
                  <input placeholder="Founder" />
                </label>
              ) : null}
              <label>
                Email
                <input type="email" placeholder="founder@drawai.local" />
              </label>
              {mode !== "forgot" ? (
                <label>
                  Password
                  <input type="password" placeholder="••••••••••" />
                </label>
              ) : null}
            </>
          )}
          {message ? <Badge tone="good">{message}</Badge> : null}
          <ActionButton tone="primary" onClick={() => setMessage(mode === "forgot" ? "Reset link prepared" : mode === "team" ? `Switched to ${team}` : mode === "invite" ? "Invite accepted" : "Session ready")}>
            <Lock size={16} />
            Continue
          </ActionButton>
        </form>

        <aside className="info-panel">
          <Badge tone="good">Secure preview</Badge>
          <h2>Workspace permissions</h2>
          <div className="permission-grid">
            {["owner", "editor", "commenter", "viewer"].map((role) => (
              <div className="permission-row" key={role}>
                <strong>{getRoleLabel(role)}</strong>
                <span>{can(role, "edit") ? "Can edit" : can(role, "comment") ? "Can comment" : "Can view"}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

function DashboardView({ activeFileId, createWorkspaceFile, moveFileToTrash, onOpenFile, restoreWorkspaceFile }) {
  const { comments, files } = useData();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const filters = ["All", "Recents", "Created by Me", "Folders", "Unsorted"];
  const activeFiles = files.filter((file) => file.status !== "trash");
  const fileRows = files
    .filter((file) => {
      if (activeFilter === "Recents") return file.status !== "trash";
      if (activeFilter === "Created by Me") return file.owner === "Founder" && file.status !== "trash";
      if (activeFilter === "Folders") return file.folder && file.status !== "trash";
      if (activeFilter === "Unsorted") return (!file.folder || file.folder === "Unsorted") && file.status !== "trash";
      return true;
    })
    .filter((file) => {
      const haystack = `${file.title} ${file.folder} ${file.kind} ${file.owner}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function createBlankFile() {
    createWorkspaceFile({
      title: `Untitled file ${activeFiles.length + 1}`,
      kind: "Flowchart",
      folder: "Unsorted",
      markdown: "## Untitled file\nStart writing your notes here.",
      diagramDsl: diagramExamples.flowchart
    });
  }

  function createAiFile(kind) {
    const isDocument = kind === "document";
    createWorkspaceFile({
      title: isDocument ? `AI Document ${activeFiles.length + 1}` : `AI Diagram ${activeFiles.length + 1}`,
      kind: isDocument ? "AI document" : "AI diagram",
      folder: "Unsorted",
      markdown: isDocument
        ? "## Generated document\nAI generated outline ready for editing.\n\n- Review assumptions\n- Add owners\n- Publish when ready"
        : "## Generated diagram\nAI generated flow ready for editing.",
      diagramDsl: isDocument ? diagramExamples.system : diagramExamples.flowchart
    });
  }

  return (
    <div className="eraser-dashboard">
      <header className="eraser-mainbar">
        <nav className="eraser-filter-tabs" aria-label="File filters">
          {filters.map((filter) => (
            <button className={activeFilter === filter ? "is-active" : ""} key={filter} type="button" onClick={() => setActiveFilter(filter)}>
              {filter}
            </button>
          ))}
        </nav>

        <div className="eraser-top-actions">
          <label className="eraser-search">
            <Search size={15} />
            <input id="eraser-dashboard-search" type="search" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
            <kbd>/</kbd>
          </label>
          <button className="eraser-key-button" type="button" onClick={() => document.querySelector("#eraser-dashboard-search")?.focus()}>Ctrl K</button>
          <div className="eraser-avatar-stack" aria-label="Team members">
            <span className="eraser-avatar eraser-avatar-red" />
            <span className="eraser-avatar eraser-avatar-gray" />
            <span className="eraser-avatar eraser-avatar-gray" />
          </div>
          <button className="eraser-invite" type="button" onClick={() => showNotice("Invite link copied")}>
            <Send size={13} fill="currentColor" />
            Invite
          </button>
        </div>
      </header>

      <section className="eraser-create-row" aria-label="Create">
        <button className="eraser-create-card" type="button" onClick={createBlankFile}>
          <Plus size={43} strokeWidth={1.25} />
          <span>Create a Blank File</span>
        </button>
        <button className="eraser-create-card" type="button" onClick={() => createAiFile("diagram")}>
          <Sparkles size={42} strokeWidth={1.25} />
          <span>Generate an AI Diagram</span>
        </button>
        <button className="eraser-create-card" type="button" onClick={() => createAiFile("document")}>
          <Sparkles size={42} strokeWidth={1.25} />
          <span>Generate an AI Document</span>
        </button>
      </section>

      <section className="eraser-file-table" aria-label="Files">
        <div className="eraser-file-header">
          <span>Name</span>
          <span>Location</span>
          <span>Created</span>
          <span>&darr; Edited</span>
          <span>Comments</span>
          <span>Author</span>
          <span />
        </div>
        {fileRows.map((file) => (
          <div
            className={activeFileId === file.id ? "eraser-file-row is-selected" : "eraser-file-row"}
            key={file.id}
          >
            <button className="eraser-file-open" type="button" onClick={() => onOpenFile(file.id)}>
              <strong>{file.title}</strong>
            </button>
            <span className="eraser-muted">{file.folder || "-"}</span>
            <span>{fileDateLabel(file)}</span>
            <span>{file.updated ?? "Just now"}</span>
            <span>{comments.filter((comment) => comment.fileId === file.id && comment.status !== "resolved").length}</span>
            <span><span className="eraser-avatar eraser-avatar-red" /></span>
            {file.status === "trash" ? (
              <button className="eraser-row-more" type="button" onClick={() => restoreWorkspaceFile(file.id)}>Restore</button>
            ) : (
              <button className="eraser-row-more" type="button" onClick={() => moveFileToTrash(file.id)}>Delete</button>
            )}
          </div>
        ))}
        {!fileRows.length ? <div className="eraser-empty-row">No files match this view.</div> : null}
      </section>

      {notice ? <div className="eraser-dashboard-status">{notice}</div> : null}
      <button className="eraser-help" type="button" aria-label="Help" onClick={() => showNotice("Shortcuts: / search, Ctrl K command, Alt N new file")}>?</button>
    </div>
  );
}

function EditorView({ file, updateWorkspaceFile }) {
  const { comments: dataComments, teamMembers, workspace } = useData();
  const storageKey = `drawai:${file.id}`;
  const persisted = readStorage(storageKey);
  const [title, setTitle] = useState(persisted.title ?? file.title);
  const [markdown, setMarkdown] = useState(persisted.markdown ?? file.markdown ?? defaultMarkdown);
  const [diagramDsl, setDiagramDsl] = useState(persisted.diagramDsl ?? file.diagramDsl ?? diagramExamples.architecture);
  const [flowNodes, setFlowNodes] = useState(persisted.flowNodes ?? createDefaultFlowNodes());
  const [activePanel, setActivePanel] = useState("canvas");
  const [tool, setTool] = useState("select");
  const [zoom, setZoom] = useState(Number(persisted.zoom ?? 92));
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState((persisted.flowNodes ?? createDefaultFlowNodes())[0]?.id ?? "recording");
  const [autosave, setAutosave] = useState("Saved");
  const [commandOpen, setCommandOpen] = useState(false);
  const [state, setState] = useState("Normal");
  const [fill, setFill] = useState("#ffffff");
  const [stroke, setStroke] = useState("#1f766f");
  const [lineWidth, setLineWidth] = useState(2);
  const [radius, setRadius] = useState(8);
  const [opacity, setOpacity] = useState(100);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportJob, setExportJob] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("Show signup, session creation, workspace role lookup, and export permission checks.");
  const [aiMode, setAiMode] = useState("Architecture");
  const [aiState, setAiState] = useState("idle");
  const [reviewDsl, setReviewDsl] = useState("");
  const [commentList, setCommentList] = useState(() => dataComments.filter((comment) => comment.fileId === file.id || !comment.fileId));
  const [newComment, setNewComment] = useState("");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const diagram = useMemo(() => parseDiagramDsl(diagramDsl), [diagramDsl]);
  const nodes = useMemo(() => diagramLayout(diagram.nodes), [diagram.nodes]);
  const blocks = useMemo(() => markdownToBlocks(markdown), [markdown]);
  const credits = estimateAiCredits(aiPrompt, "generate");
  const selectedFlowNode = flowNodes.find((node) => node.id === selectedNode) ?? flowNodes[0];

  useEffect(() => {
    const nextStorageKey = `drawai:${file.id}`;
    const nextPersisted = readStorage(nextStorageKey);
    const nextNodes = nextPersisted.flowNodes ?? createDefaultFlowNodes();
    setTitle(nextPersisted.title ?? file.title);
    setMarkdown(nextPersisted.markdown ?? file.markdown ?? defaultMarkdown);
    setDiagramDsl(nextPersisted.diagramDsl ?? file.diagramDsl ?? diagramExamples.architecture);
    setFlowNodes(nextNodes);
    setSelectedNode(nextNodes[0]?.id ?? "recording");
    setZoom(Number(nextPersisted.zoom ?? 92));
    setActivePanel("canvas");
  }, [file.id, file.title, file.markdown, file.diagramDsl]);

  useEffect(() => {
    setAutosave("Saving");
    const timer = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({ title, markdown, diagramDsl, zoom, flowNodes }));
      updateWorkspaceFile?.(file.id, { title, markdown, diagramDsl });
      saveFile(file.id, { title, markdown, diagramDsl, contentVersion: 1 }).catch(() => undefined);
      setAutosave("Saved");
    }, 450);

    return () => window.clearTimeout(timer);
  }, [storageKey, file.id, title, markdown, diagramDsl, zoom, flowNodes]);

  useEffect(() => {
    setCommentList(dataComments.filter((comment) => comment.fileId === file.id || !comment.fileId));
  }, [dataComments, file.id]);

  useEffect(() => {
    const handleKeydown = (event) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
        setAutosave("Saved");
      }
      if ((event.ctrlKey || event.metaKey) && key === "=") {
        event.preventDefault();
        setZoom((value) => Math.min(180, value + 8));
      }
      if ((event.ctrlKey || event.metaKey) && key === "-") {
        event.preventDefault();
        setZoom((value) => Math.max(40, value - 8));
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  function runAi() {
    setAiState("streaming");
    const fallbackDsl = `diagram ${aiMode.toLowerCase().replace(" ", "-")}
Web client -> API gateway: signup request
API gateway -> Auth service: create session
Auth service -> Workspace DB: resolve role
API gateway -> Export worker: permission check
Export worker -> Object storage: store artifact`;

    generateDiagram({ prompt: aiPrompt, diagramType: aiMode, fileId: file.id })
      .then((result) => setReviewDsl(result.diagramDsl ?? result.source ?? fallbackDsl))
      .catch(() => setReviewDsl(fallbackDsl))
      .finally(() => {
      setAiState("review");
      });
  }

  function startExport(format) {
    setExportJob({ format, progress: 25, status: "Preparing" });
    window.setTimeout(() => setExportJob({ format, progress: 72, status: "Rendering" }), 250);
    window.setTimeout(() => {
      createExport(file.id, format).catch(() => undefined);
      const flowSvg = buildFlowSvg(flowNodes, title);
      if (format === "Markdown") downloadText(`${title}.md`, buildMarkdownExport({ title, markdown, diagramDsl }));
      if (format === "HTML") downloadText(`${title}.html`, buildHtmlExport({ title, markdown }));
      if (format === "SVG") downloadText(`${title}.svg`, flowSvg);
      if (format === "PNG") exportSvgAsPng(title, flowSvg);
      if (format === "Clipboard") navigator.clipboard?.writeText(buildMarkdownExport({ title, markdown, diagramDsl }));
      if (format === "PDF") window.print();
      setExportJob({ format, progress: 100, status: "Complete" });
    }, 600);
  }

  function addComment() {
    if (!newComment.trim()) return;
    const comment = { id: `c${Date.now()}`, fileId: file.id, author: "Founder", target: selectedFlowNode?.label.replace(/\n/g, " ") ?? "File", text: newComment, status: "open" };
    setCommentList((items) => [comment, ...items]);
    createComment(file.id, { text: comment.text, author: comment.author, target: comment.target }).catch(() => undefined);
    setNewComment("");
  }

  function addFlowNode(kind = tool) {
    const isRect = kind === "rect" || kind === "select";
    const node = {
      id: `node-${Date.now()}`,
      label: isRect ? "New step" : "New decision",
      kind: isRect ? "rect" : "oval",
      icon: isRect ? "file" : "spark",
      x: 260 + (flowNodes.length % 5) * 45,
      y: 360 + (flowNodes.length % 4) * 58,
      w: isRect ? 170 : 185,
      h: isRect ? 88 : 98
    };
    setFlowNodes((items) => [...items, node]);
    setSelectedNode(node.id);
    setDiagramDsl((value) => `${value}\n${selectedFlowNode?.label.replace(/\n/g, " ") ?? "Start"} -> ${node.label}: next`);
  }

  function updateFlowNode(nodeId, patch) {
    setFlowNodes((items) => items.map((item) => item.id === nodeId ? { ...item, ...patch } : item));
  }

  function duplicateSelectedNode() {
    if (!selectedFlowNode) return;
    const copy = { ...selectedFlowNode, id: `node-${Date.now()}`, label: `${selectedFlowNode.label.replace(/\n/g, " ")} copy`, x: selectedFlowNode.x + 36, y: selectedFlowNode.y + 36 };
    setFlowNodes((items) => [...items, copy]);
    setSelectedNode(copy.id);
  }

  function deleteSelectedNode() {
    if (!selectedFlowNode || flowNodes.length <= 1) return;
    setFlowNodes((items) => items.filter((item) => item.id !== selectedFlowNode.id));
    setSelectedNode(flowNodes.find((node) => node.id !== selectedFlowNode.id)?.id ?? "recording");
  }

  function applyGeneratedDiagram(nextDsl) {
    setDiagramDsl(nextDsl);
    const generatedNodes = diagramLayout(parseDiagramDsl(nextDsl).nodes).map((node, index) => ({
      id: `ai-${index}-${Date.now()}`,
      label: node.label,
      kind: index === 0 ? "rect" : "oval",
      icon: index === 0 ? "file" : "spark",
      x: 120 + index * 215,
      y: index % 2 ? 350 : 220,
      w: 180,
      h: 96
    }));
    if (generatedNodes.length) {
      setFlowNodes(generatedNodes);
      setSelectedNode(generatedNodes[0].id);
    }
  }

  function resolveEditorComment(commentId) {
    setCommentList((items) => items.map((item) => item.id === commentId ? { ...item, status: "resolved" } : item));
    resolveCommentRequest(commentId).catch(() => undefined);
  }

  const editorMode = ["document", "both", "canvas"].includes(activePanel) ? activePanel : "canvas";

  return (
    <div className="eraser-editor">
      <header className="eraser-editor-topbar">
        <div className="eraser-editor-brand">
          <span className="eraser-brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <input className="eraser-file-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <button className="eraser-icon-text" type="button" aria-label="File options">...</button>
        </div>

        <div className="eraser-mode-switch" aria-label="View mode">
          {[
            ["document", "Document"],
            ["both", "Both"],
            ["canvas", "Canvas"]
          ].map(([id, label]) => (
            <button className={editorMode === id ? "is-active" : ""} key={id} type="button" onClick={() => setActivePanel(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="eraser-editor-actions">
          <button className="eraser-editor-control" type="button" onClick={() => setCommandOpen(true)}>Ctrl K</button>
          <button className="eraser-editor-control" type="button" onClick={() => setShareOpen(true)}>
            Share
            <Link size={13} />
          </button>
          <button className="eraser-ai-chat" type="button" onClick={() => setActivePanel("ai")}>
            <Sparkles size={14} />
            AI Chat
          </button>
          <button className="eraser-editor-icon" type="button" aria-label="Comments" onClick={() => setActivePanel("comments")}>
            <MessageSquare size={17} />
          </button>
          <button className="eraser-editor-icon" type="button" aria-label="Version history" onClick={() => setVersionsOpen(true)}>
            <Clipboard size={17} />
          </button>
        </div>
      </header>

      {state !== "Normal" ? <StateBanner state={state} /> : null}

      <main className={`eraser-editor-main eraser-mode-${editorMode}`}>
        {editorMode !== "canvas" ? (
          <EraserDocumentPanel
            blocks={blocks}
            findText={findText}
            markdown={markdown}
            setFindText={setFindText}
            setMarkdown={setMarkdown}
          />
        ) : null}

        <section className="eraser-canvas-area" aria-label="Canvas">
          <EraserEditorToolRail addFlowNode={addFlowNode} setActivePanel={setActivePanel} setTool={setTool} tool={tool} />
          <EraserFlowCanvas
            flowNodes={flowNodes}
            selectedNode={selectedNode}
            setFlowNodes={setFlowNodes}
            setSelectedNode={setSelectedNode}
            tool={tool}
            updateFlowNode={updateFlowNode}
            zoom={zoom}
          />
          <div className="eraser-zoom-control">
            <button type="button" onClick={() => setZoom((value) => Math.max(40, value - 10))}>-</button>
            <button type="button" onClick={() => setZoom(100)}>{zoom}%</button>
            <button type="button" onClick={() => setZoom((value) => Math.min(180, value + 10))}>+</button>
            <ChevronDown size={12} />
          </div>
        </section>

        {activePanel === "ai" || activePanel === "code" || activePanel === "exports" || activePanel === "comments" ? (
          <aside className="eraser-editor-drawer">
            {activePanel === "ai" ? (
              <AiPanel
                aiMode={aiMode}
                aiPrompt={aiPrompt}
                aiState={aiState}
                credits={credits}
                reviewDsl={reviewDsl}
                runAi={runAi}
                setAiMode={setAiMode}
                setAiPrompt={setAiPrompt}
                setDiagramDsl={setDiagramDsl}
                setReviewDsl={setReviewDsl}
                setAiState={setAiState}
                onApplyGenerated={applyGeneratedDiagram}
              />
            ) : activePanel === "code" ? (
              <CodePanel diagram={diagram} diagramDsl={diagramDsl} setDiagramDsl={setDiagramDsl} />
            ) : activePanel === "exports" ? (
              <ExportPanel exportJob={exportJob} setExportJob={setExportJob} startExport={startExport} />
            ) : (
              <EraserCommentsPanel addComment={addComment} commentList={commentList} newComment={newComment} resolveComment={resolveEditorComment} setNewComment={setNewComment} />
            )}
          </aside>
        ) : null}
      </main>

      <div className="eraser-bottom-bar" aria-label="Selection controls">
        <input
          aria-label="Selected node label"
          disabled={!selectedFlowNode}
          value={selectedFlowNode?.label.replace(/\n/g, " ") ?? ""}
          onChange={(event) => selectedFlowNode ? updateFlowNode(selectedFlowNode.id, { label: event.target.value }) : undefined}
          placeholder="No selection"
        />
        <span className="eraser-bottom-divider" />
        <button type="button" title="Copy link" onClick={() => navigator.clipboard?.writeText(`${window.location.href}#${selectedFlowNode?.id ?? ""}`)}>
          <Link size={17} />
        </button>
        <button type="button" title={autosave}>
          <History size={17} />
          <ChevronDown size={10} />
        </button>
        <button type="button" title="Style">
          <Diamond size={16} />
          <ChevronDown size={10} />
        </button>
        <button type="button" title="Shape">
          <Square size={16} />
          <ChevronDown size={10} />
        </button>
        <button type="button" className="eraser-bottom-size" onClick={() => selectedFlowNode ? updateFlowNode(selectedFlowNode.id, { w: Math.max(120, selectedFlowNode.w - 10), h: Math.max(58, selectedFlowNode.h - 6) }) : undefined}>
          Small
          <ChevronDown size={10} />
        </button>
        <span className="eraser-bottom-divider" />
        <button type="button" title="Duplicate" onClick={duplicateSelectedNode}>
          <Copy size={16} />
        </button>
        <button type="button" title="Delete" onClick={deleteSelectedNode}>
          <Trash2 size={16} />
        </button>
        <button type="button" title="Export" onClick={() => setActivePanel("exports")}>
          <Download size={16} />
        </button>
      </div>

      {commandOpen ? <CommandPalette setActivePanel={setActivePanel} setCommandOpen={setCommandOpen} setZoom={setZoom} /> : null}
      {shareOpen ? <ShareModal file={file} setShareOpen={setShareOpen} /> : null}
      {versionsOpen ? <VersionDrawer setVersionsOpen={setVersionsOpen} /> : null}
    </div>
  );

}

function EraserEditorToolRail({ addFlowNode, setActivePanel, setTool, tool }) {
  const toolGroups = [
    [
      { id: "add", label: "Add", shortcut: "/", icon: Plus },
      { id: "ai", label: "AI", shortcut: "CTRL I", icon: Sparkles }
    ],
    [
      { id: "select", label: "Select", shortcut: "V", icon: MousePointer2 },
      { id: "rect", label: "Rectangle", shortcut: "R", icon: Square },
      { id: "diamond", label: "Circle", shortcut: "O", icon: Diamond },
      { id: "arrow", label: "Arrow", shortcut: "A", icon: Send },
      { id: "line", label: "Line", shortcut: "L", icon: PenLine },
      { id: "text", label: "Text", shortcut: "T", icon: FileText },
      { id: "magic", label: "Magic", shortcut: "I", icon: Wand2 }
    ],
    [
      { id: "frame", label: "Frame", shortcut: "F", icon: PanelRight },
      { id: "comment", label: "Comment", shortcut: "C", icon: MessageSquare }
    ]
  ];

  return (
    <nav className="eraser-tool-rail" aria-label="Canvas tools">
      {toolGroups.map((group, groupIndex) => (
        <div className="eraser-tool-group" key={`group-${groupIndex}`}>
          {group.map(({ id, label, shortcut, icon: Icon }) => (
            <button
              className={tool === id ? "is-active" : ""}
              key={id}
              type="button"
              title={label}
              onClick={() => {
                if (id === "add") {
                  addFlowNode("rect");
                  return;
                }
                if (id === "ai") {
                  setActivePanel("ai");
                  return;
                }
                if (id === "comment") {
                  setActivePanel("comments");
                  return;
                }
                setTool(id);
              }}
            >
              <Icon size={16} />
              <small>{shortcut}</small>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

function EraserDocumentPanel({ blocks, findText, markdown, setFindText, setMarkdown }) {
  return (
    <aside className="eraser-document-panel">
      <div className="eraser-panel-title">
        <strong>Document</strong>
        <button type="button" onClick={() => setMarkdown((value) => `${value}\n\n## New section\nWrite the next part here.`)}><Plus size={14} /></button>
      </div>
      <label className="eraser-panel-search">
        <Search size={14} />
        <input value={findText} onChange={(event) => setFindText(event.target.value)} placeholder="Search document" />
      </label>
      <textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} spellCheck="true" />
      <div className="eraser-doc-outline">
        {blocks.filter((block) => ["h2", "h3"].includes(block.type)).map((block, index) => (
          <button className={findText && block.text.toLowerCase().includes(findText.toLowerCase()) ? "is-hit" : ""} key={`${block.text}-${index}`} type="button">
            <FileText size={13} />
            {block.text}
          </button>
        ))}
      </div>
    </aside>
  );
}

function EraserCommentsPanel({ addComment, commentList, newComment, resolveComment, setNewComment }) {
  return (
    <div className="eraser-comments-panel">
      <PaneHeader title="Comments" icon={MessageSquare} />
      <div className="comment-list">
        {commentList.map((comment) => (
          <div className={comment.status === "resolved" ? "comment is-resolved" : "comment"} key={comment.id}>
            <strong>{comment.author}</strong>
            <small>{comment.target}</small>
            <p>{comment.text}</p>
            <button type="button" onClick={() => resolveComment(comment.id)}>
              Resolve
            </button>
          </div>
        ))}
      </div>
      <label className="comment-compose">
        <input value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="@mention or comment" />
        <button type="button" onClick={addComment}><Send size={14} /></button>
      </label>
    </div>
  );
}

function EraserFlowCanvas({ flowNodes, selectedNode, setFlowNodes, setSelectedNode, tool, updateFlowNode, zoom }) {
  const [drag, setDrag] = useState(null);
  const [editingNode, setEditingNode] = useState(null);

  useEffect(() => {
    if (!drag) return undefined;

    function handlePointerMove(event) {
      const scale = zoom / 100;
      setFlowNodes((items) => items.map((item) => item.id === drag.id ? {
        ...item,
        x: Math.round(drag.nodeX + (event.clientX - drag.startX) / scale),
        y: Math.round(drag.nodeY + (event.clientY - drag.startY) / scale)
      } : item));
    }

    function handlePointerUp() {
      setDrag(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [drag, setFlowNodes, zoom]);

  function addNodeAt(event) {
    if (!["rect", "diamond", "round", "text", "note"].includes(tool)) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const scale = zoom / 100;
    const node = {
      id: `node-${Date.now()}`,
      label: tool === "text" ? "Text note" : tool === "diamond" ? "Decision" : "New step",
      kind: tool === "rect" ? "rect" : "oval",
      icon: tool === "text" ? "task" : "spark",
      x: Math.round((event.clientX - bounds.left) / scale),
      y: Math.round((event.clientY - bounds.top) / scale),
      w: tool === "text" ? 160 : 180,
      h: tool === "text" ? 70 : 96
    };
    setFlowNodes((items) => [...items, node]);
    setSelectedNode(node.id);
  }

  return (
    <div className="eraser-canvas-viewport">
      <div className="eraser-flow-world" style={{ transform: `scale(${zoom / 100})` }} onDoubleClick={addNodeAt}>
        <span className="eraser-diagram-type">Flowchart</span>
        <div className="eraser-outer-lane" />
        <div className="eraser-upload-lane">
          <span>UPLOADPATH</span>
        </div>
        <div className="eraser-embedding-lane">
          <span>EMBEDDINGPATH</span>
        </div>

        <svg className="eraser-flow-lines" viewBox="0 0 1900 1080" aria-hidden="true">
          <defs>
            <marker id="eraser-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M0,0 L8,4 L0,8 Z" fill="#d8d8d8" />
            </marker>
          </defs>
          <path d="M220 254H335" />
          <path d="M505 254H575" />
          <path d="M755 254H820" />
          <path d="M1010 254H1070" />
          <path d="M1260 254H1320" />
          <path d="M1510 254H1570" />
          <path d="M380 646H1820" />
          <path d="M380 646C420 646 420 720 380 720L380 860H500" />
          <path d="M690 886H760" />
          <path d="M950 886H1030" />
          <path d="M1220 851H1530" />
        </svg>

        {flowNodes.map((node) => (
          <div
            className={`eraser-flow-node eraser-node-${node.kind} ${selectedNode === node.id ? "is-selected" : ""}`}
            key={node.id}
            role="button"
            style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
            tabIndex="0"
            onClick={() => setSelectedNode(node.id)}
            onDoubleClick={(event) => {
              event.stopPropagation();
              setSelectedNode(node.id);
              setEditingNode(node.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                setSelectedNode(node.id);
                setEditingNode(node.id);
                return;
              }
              const moves = { ArrowUp: [0, -8], ArrowDown: [0, 8], ArrowLeft: [-8, 0], ArrowRight: [8, 0] };
              if (!moves[event.key]) return;
              event.preventDefault();
              const [dx, dy] = moves[event.key];
              updateFlowNode(node.id, { x: node.x + dx, y: node.y + dy });
            }}
            onPointerDown={(event) => {
              setSelectedNode(node.id);
              setDrag({ id: node.id, startX: event.clientX, startY: event.clientY, nodeX: node.x, nodeY: node.y });
            }}
          >
            <EraserNodeIcon type={node.icon} />
            {editingNode === node.id ? (
              <textarea
                autoFocus
                className="eraser-flow-node-editor"
                value={node.label}
                onBlur={() => setEditingNode(null)}
                onChange={(event) => updateFlowNode(node.id, { label: event.target.value })}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Escape" || (event.key === "Enter" && !event.shiftKey)) {
                    event.preventDefault();
                    setEditingNode(null);
                  }
                }}
                onPointerDown={(event) => event.stopPropagation()}
              />
            ) : (
              <span className="eraser-flow-node-label">
                {node.label.split("\n").map((line) => <span key={line}>{line}</span>)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EraserNodeIcon({ type }) {
  const icons = {
    check: Check,
    chat: MessageSquare,
    cloud: Cloud,
    db: Table2,
    file: FileText,
    link: Link,
    mic: Activity,
    play: Send,
    send: Send,
    spark: Sparkles,
    task: Clipboard,
    upload: Cloud
  };
  const Icon = icons[type] ?? Square;
  return (
    <span className="eraser-node-icon">
      <Icon size={16} />
    </span>
  );
}

function PaneHeader({ title, icon: Icon }) {
  return (
    <div className="pane-header">
      <span>{title}</span>
      <Icon size={16} />
    </div>
  );
}

function StateBanner({ state }) {
  const Icon = state === "Loading" ? Loader2 : state === "Permission denied" ? Lock : TriangleAlert;

  return (
    <div className="state-banner">
      <Icon size={18} className={state === "Loading" ? "spin" : ""} />
      <strong>{state}</strong>
      <span>{state === "Offline" ? "Changes are queued locally." : state === "Permission denied" ? "This role can view but cannot edit." : state === "Error" ? "The last update can be retried." : "Loading workspace data."}</span>
    </div>
  );
}

function CanvasPanel(props) {
  const {
    diagram,
    fill,
    lineWidth,
    nodes,
    opacity,
    pan,
    radius,
    selectedNode,
    setPan,
    setSelectedNode,
    setTool,
    setZoom,
    stroke,
    tool,
    zoom
  } = props;

  return (
    <div className="canvas-panel">
      <div className="canvas-toolbar" aria-label="Canvas tools">
        {shapeTools.map(({ id, label, icon: Icon }) => (
          <IconButton active={tool === id} key={id} label={label} onClick={() => setTool(id)}>
            <Icon size={16} />
          </IconButton>
        ))}
        <span className="toolbar-divider" />
        <IconButton label="Pan left" onClick={() => setPan((value) => ({ ...value, x: value.x - 16 }))}><Minus size={16} /></IconButton>
        <IconButton label="Zoom out" onClick={() => setZoom((value) => Math.max(40, value - 8))}><ZoomOut size={16} /></IconButton>
        <span className="zoom-label">{zoom}%</span>
        <IconButton label="Zoom in" onClick={() => setZoom((value) => Math.min(180, value + 8))}><ZoomIn size={16} /></IconButton>
        <ActionButton onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); }}>Fit</ActionButton>
      </div>

      <div className="canvas-stage">
        <DiagramSvg
          diagram={diagram}
          fill={fill}
          lineWidth={lineWidth}
          nodes={nodes}
          opacity={opacity}
          pan={pan}
          radius={radius}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          stroke={stroke}
          zoom={zoom}
        />
        <div className="cursor cursor-a">Maya</div>
        <div className="cursor cursor-b">Dev</div>
        <div className="minimap">
          <MiniDiagram />
        </div>
      </div>
    </div>
  );
}

function DiagramSvg({ diagram, fill, lineWidth, nodes, opacity, pan, radius, selectedNode, setSelectedNode, stroke, zoom }) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <svg
      id="diagram-svg"
      className="diagram-svg"
      style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})` }}
      viewBox="0 0 760 480"
      role="img"
      aria-label={`${diagram.type} diagram`}
    >
      <defs>
        <marker id="arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
          <path d="M0,0 L8,4 L0,8 Z" fill="#31505a" />
        </marker>
      </defs>
      <path className="grid-line" d="M60 80H700M60 160H700M60 240H700M60 320H700M60 400H700" />
      <path className="grid-line" d="M120 40V430M240 40V430M360 40V430M480 40V430M600 40V430" />

      {diagram.edges.map((edge) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;
        const startX = from.x + from.width;
        const startY = from.y + from.height / 2;
        const endX = to.x;
        const endY = to.y + to.height / 2;
        const midX = (startX + endX) / 2;
        return (
          <g key={edge.id}>
            <path className="connector" d={`M${startX} ${startY} C${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`} />
            {edge.label ? <text className="edge-label" x={midX} y={(startY + endY) / 2 - 8}>{edge.label}</text> : null}
          </g>
        );
      })}

      {nodes.map((node) => (
        <g
          className={selectedNode === node.label ? "diagram-node is-selected" : "diagram-node"}
          key={node.id}
          onClick={() => setSelectedNode(node.label)}
          role="button"
          tabIndex="0"
        >
          <rect
            fill={selectedNode === node.label ? fill : "#ffffff"}
            height={node.height}
            opacity={opacity / 100}
            rx={radius}
            stroke={selectedNode === node.label ? stroke : "#7c9da1"}
            strokeWidth={lineWidth}
            width={node.width}
            x={node.x}
            y={node.y}
          />
          <text x={node.x + node.width / 2} y={node.y + 30}>{node.label}</text>
          <text className="muted-text" x={node.x + node.width / 2} y={node.y + 50}>{diagram.type}</text>
        </g>
      ))}
    </svg>
  );
}

function CodePanel({ diagram, diagramDsl, setDiagramDsl }) {
  const [type, setType] = useState(diagram.type === "unknown" ? "architecture" : diagram.type);

  return (
    <div className="code-panel">
      <div className="code-actions">
        <select value={type} onChange={(event) => {
          setType(event.target.value);
          setDiagramDsl(diagramExamples[event.target.value]);
        }}>
          {diagramTypes.map((item) => <option key={item}>{item}</option>)}
        </select>
        <ActionButton onClick={() => setDiagramDsl(quickFixDiagramDsl(diagramDsl))}>
          <Wand2 size={16} />
          Quick fix
        </ActionButton>
        <ActionButton onClick={() => setDiagramDsl(blocksToMarkdown(markdownToBlocks(defaultMarkdown)))}>
          <RefreshCw size={16} />
          From document
        </ActionButton>
      </div>
      <div className="code-grid">
        <textarea className="code-editor" value={diagramDsl} onChange={(event) => setDiagramDsl(event.target.value)} spellCheck="false" />
        <aside className="code-side">
          <span className="section-label">Autocomplete</span>
          {["API gateway -> Auth service: validate", "Export worker -> Object storage: upload", "Workspace DB -> API gateway: role"].map((item) => (
            <button key={item} type="button" onClick={() => setDiagramDsl((value) => `${value}\n${item}`)}>
              <Code2 size={14} />
              {item}
            </button>
          ))}
          <span className="section-label">Lint</span>
          {diagram.diagnostics.length ? diagram.diagnostics.map((item) => (
            <div className="diagnostic" key={`${item.line}-${item.message}`}>Line {item.line}: {item.message}</div>
          )) : <div className="diagnostic is-ok">No syntax issues</div>}
          <span className="section-label">Examples</span>
          {Object.keys(diagramExamples).map((item) => (
            <button key={item} type="button" onClick={() => setDiagramDsl(diagramExamples[item])}>{item}</button>
          ))}
        </aside>
      </div>
    </div>
  );
}

function AiPanel(props) {
  const {
    aiMode,
    aiPrompt,
    aiState,
    credits,
    onApplyGenerated,
    reviewDsl,
    runAi,
    setAiMode,
    setAiPrompt,
    setAiState,
    setDiagramDsl,
    setReviewDsl
  } = props;

  return (
    <div className="ai-workbench">
      <section className="prompt-panel">
        <PaneHeader title="AI diagram" icon={Bot} />
        <div className="template-grid">
          {aiTemplates.map((template) => (
            <button className={aiMode === template ? "template-chip is-active" : "template-chip"} key={template} type="button" onClick={() => setAiMode(template)}>
              {template}
            </button>
          ))}
        </div>
        <textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} />
        <div className="ai-footer">
          <Badge tone="warn">{credits} credits</Badge>
          <ActionButton tone="primary" onClick={runAi} disabled={aiState === "streaming"}>
            {aiState === "streaming" ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
            Generate
          </ActionButton>
        </div>
      </section>
      <section className="ai-actions">
        <span className="section-label">Edit actions</span>
        {aiActions.map((action) => (
          <button key={action} type="button" onClick={() => setAiPrompt(`${action}: ${aiPrompt}`)}>
            <Wand2 size={15} />
            {action}
          </button>
        ))}
      </section>
      {aiState === "review" ? (
        <section className="review-panel">
          <PaneHeader title="Review generated diagram" icon={Eye} />
          <pre>{reviewDsl}</pre>
          <div className="header-actions">
            <ActionButton onClick={() => { setReviewDsl(""); setAiState("idle"); }}>Discard</ActionButton>
            <ActionButton tone="primary" onClick={() => { (onApplyGenerated ?? setDiagramDsl)(reviewDsl); setAiState("idle"); }}>
              <Check size={16} />
              Replace canvas
            </ActionButton>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ExportPanel({ exportJob, setExportJob, startExport }) {
  return (
    <div className="export-panel">
      <section className="export-grid">
        {exportFormats.map((format) => (
          <button className="export-card" key={format} type="button" onClick={() => startExport(format)}>
            {format === "PNG" ? <FileImage size={20} /> : format === "SVG" ? <Braces size={20} /> : format === "PDF" ? <FileText size={20} /> : format === "Clipboard" ? <Clipboard size={20} /> : <FileCode2 size={20} />}
            <strong>{format}</strong>
          </button>
        ))}
      </section>
      <section className="publish-panel">
        <PaneHeader title="Publishing" icon={Globe2} />
        <div className="embed-grid">
          <div><strong>Public viewer</strong><code>https://drawai.local/share/auth-architecture</code></div>
          <div><strong>Notion embed</strong><code>/embed/drawai/auth-architecture</code></div>
          <div><strong>Confluence macro</strong><code>{`{drawai:file=auth-architecture}`}</code></div>
        </div>
      </section>
      {exportJob ? (
        <div className="export-job">
          <strong>{exportJob.format}</strong>
          <progress value={exportJob.progress} max="100" />
          <span>{exportJob.status}</span>
          <button type="button" onClick={() => setExportJob(null)}>Cancel</button>
        </div>
      ) : null}
    </div>
  );
}

function PublicShareView({ file }) {
  const [zoom, setZoom] = useState(96);
  const diagram = parseDiagramDsl(diagramExamples.architecture);

  return (
    <div className="screen">
      <SectionHeader
        eyebrow="Read-only public page"
        title={file.title}
        actions={
          <>
            <ActionButton onClick={() => setZoom((value) => Math.max(60, value - 10))}><ZoomOut size={16} />Zoom</ActionButton>
            <ActionButton onClick={() => setZoom((value) => Math.min(160, value + 10))}><ZoomIn size={16} />Zoom</ActionButton>
          </>
        }
      />
      <div className="public-layout">
        <aside className="public-nav">
          <strong>Document</strong>
          <a href="#overview">Overview</a>
          <a href="#diagram">Diagram</a>
          <a href="#exports">Exports</a>
        </aside>
        <article className="public-doc">
          <h2 id="overview">Authentication flow</h2>
          <p>The shared viewer keeps navigation, zoom, and readable document structure without exposing edit controls.</p>
          <div id="diagram" className="share-diagram" style={{ "--share-zoom": zoom / 100 }}>
            <DiagramSvg diagram={diagram} fill="#ffffff" lineWidth={2} nodes={diagramLayout(diagram.nodes)} opacity={100} pan={{ x: 0, y: 0 }} radius={8} selectedNode="API gateway" setSelectedNode={() => {}} stroke="#1f766f" zoom={zoom} />
          </div>
        </article>
      </div>
    </div>
  );
}

function IntegrationsView() {
  const { apiKeys, integrations } = useData();
  const [integrationList, setIntegrationList] = useState(integrations);
  const [repo, setRepo] = useState("drawai/core-platform");
  const [branch, setBranch] = useState("main");
  const [path, setPath] = useState("/src/auth");
  const [syncStatus, setSyncStatus] = useState("Clean");
  const [apiKeyList, setApiKeyList] = useState(apiKeys);

  useEffect(() => {
    setApiKeyList(apiKeys);
    setIntegrationList(integrations);
  }, [apiKeys]);

  return (
    <div className="screen">
      <SectionHeader eyebrow="Connected workspace" title="Integrations" actions={<ActionButton tone="primary" onClick={() => setIntegrationList((items) => [{ id: `integration_${items.length + 1}`, name: "Linear", status: "Connected", detail: "Issue sync enabled", tone: "good" }, ...items])}><Plus size={16} />Connect</ActionButton>} />
      <section className="integration-grid">
        {integrationList.map((integration) => (
          <div className="integration-card" key={integration.id}>
            <div>
              <strong>{integration.name}</strong>
              <p>{integration.detail}</p>
            </div>
            <Badge tone={integration.tone}>{integration.status}</Badge>
            {integration.tone === "warn" ? (
              <ActionButton onClick={() => setIntegrationList((items) => items.map((item) => item.id === integration.id ? { ...item, status: "Connected", detail: "OAuth refreshed", tone: "good" } : item))}>
                <RefreshCw size={15} />
                Reconnect
              </ActionButton>
            ) : null}
          </div>
        ))}
      </section>

      <div className="two-column">
        <section className="panel">
          <PaneHeader title="Codebase diagram" icon={GitBranch} />
          <label>Repository<input value={repo} onChange={(event) => setRepo(event.target.value)} /></label>
          <label>Branch<input value={branch} onChange={(event) => setBranch(event.target.value)} /></label>
          <label>Paths<input value={path} onChange={(event) => setPath(event.target.value)} /></label>
          <ActionButton tone="primary" onClick={() => setSyncStatus(`Generated from ${repo}:${branch}${path}`)}><Sparkles size={16} />Generate diagram</ActionButton>
        </section>
        <section className="panel">
          <PaneHeader title="Git sync" icon={RefreshCw} />
          <Badge tone={syncStatus === "Clean" ? "good" : "warn"}>{syncStatus}</Badge>
          <p>Last commit: docs/auth-diagram.md</p>
          <div className="header-actions">
            <ActionButton onClick={() => setSyncStatus("Conflict")}>Show conflict</ActionButton>
            <ActionButton tone="primary" onClick={() => setSyncStatus("Clean")}>Commit changes</ActionButton>
          </div>
        </section>
      </div>

      <section className="panel">
        <PaneHeader title="API keys" icon={KeyRound} />
        <div className="table-list">
          {apiKeyList.map((key) => (
            <div className="table-row" key={key.id}>
              <strong>{key.name}</strong>
              <code>{key.scope}</code>
              <span>{key.lastUsed}</span>
            </div>
          ))}
        </div>
        <ActionButton onClick={() => setApiKeyList((items) => [...items, { id: `key_${items.length + 1}`, name: "New key", scope: "files:read", lastUsed: "Never" }])}>
          <Plus size={15} />
          Create key
        </ActionButton>
      </section>
    </div>
  );
}

function BillingAdminView() {
  const { plans, teamMembers, usage } = useData();
  const [planList, setPlanList] = useState(plans);
  const [members, setMembers] = useState(teamMembers);
  const [domain, setDomain] = useState("drawai.local");
  const [settings, setSettings] = useState(() => ({
    "SAML SSO": true,
    "SCIM provisioning": false,
    "Audit logs": true,
    "Data retention": true,
    "Allowed integrations": true
  }));

  useEffect(() => {
    setPlanList(plans);
    setMembers(teamMembers);
  }, [plans, teamMembers]);

  return (
    <div className="screen">
      <SectionHeader eyebrow="Workspace controls" title="Billing & admin" />
      <section className="pricing-grid">
        {planList.map((plan) => (
          <div className={plan.current ? "plan-card is-current" : "plan-card"} key={plan.name}>
            <Badge tone={plan.current ? "good" : "neutral"}>{plan.current ? "Current" : "Available"}</Badge>
            <h2>{plan.name}</h2>
            <strong>{plan.price}</strong>
            <p>{plan.limit}</p>
            <ActionButton tone={plan.current ? "default" : "primary"} onClick={() => setPlanList((items) => items.map((item) => ({ ...item, current: item.name === plan.name })))}>
              {plan.current ? "Manage" : "Checkout"}
            </ActionButton>
          </div>
        ))}
      </section>
      <div className="two-column">
        <section className="panel">
          <PaneHeader title="Team settings" icon={Users} />
          <div className="table-list">
            {members.map((member) => (
              <div className="table-row" key={member.name}>
                <span className="avatar" style={{ background: member.color }}>{member.name[0]}</span>
                <strong>{member.name}</strong>
                <select value={member.role.toLowerCase()} onChange={(event) => setMembers((items) => items.map((item) => item.name === member.name ? { ...item, role: getRoleLabel(event.target.value) } : item))}>
                  <option value="owner">Owner</option>
                  <option value="editor">Editor</option>
                  <option value="commenter">Commenter</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            ))}
          </div>
          <label>Allowed domain<input value={domain} onChange={(event) => setDomain(event.target.value)} /></label>
        </section>
        <section className="panel">
          <PaneHeader title="Enterprise" icon={ShieldCheck} />
          {Object.keys(settings).map((item) => (
            <label className="toggle-row" key={item}>
              <input type="checkbox" checked={settings[item]} onChange={(event) => setSettings((value) => ({ ...value, [item]: event.target.checked }))} />
              {item}
            </label>
          ))}
        </section>
      </div>
      <section className="panel">
        <PaneHeader title="Usage and limits" icon={Activity} />
        <div className="usage-grid">
          {usage.map((item) => (
            <Usage key={item.label} label={item.label} value={item.value} pct={item.pct} />
          ))}
        </div>
      </section>
    </div>
  );
}

function QualityView() {
  const [checks, setChecks] = useState([
    ["Unit tests", "editor utilities, permissions, formatting, diagram parsing", "Ready"],
    ["Component tests", "dashboard, auth, editor, export, share modal", "Scaffolded"],
    ["Playwright", "signup, file creation, AI generation, export, share link, comments", "Scaffolded"],
    ["Visual regression", "canvas, docs, exports, public viewer", "Scaffolded"],
    ["Accessibility", "keyboard navigation, focus, contrast, labels", "Passing"],
    ["Performance", "initial load, editor load, canvas interaction, large files", "Budgeted"]
  ]);

  return (
    <div className="screen">
      <SectionHeader eyebrow="Frontend readiness" title="Quality" actions={<ActionButton tone="primary" onClick={() => setChecks((items) => items.map(([title, detail]) => [title, detail, "Passing"]))}><Check size={16} />Run checks</ActionButton>} />
      <section className="quality-grid">
        {checks.map(([title, detail, status]) => (
          <div className="quality-card" key={title}>
            <Badge tone={status === "Passing" || status === "Ready" ? "good" : "neutral"}>{status}</Badge>
            <h2>{title}</h2>
            <p>{detail}</p>
          </div>
        ))}
      </section>
      <section className="panel">
        <PaneHeader title="Performance budgets" icon={Activity} />
        <div className="table-list">
          <div className="table-row"><strong>Initial load</strong><span>&lt; 2.5s</span><Badge tone="good">OK</Badge></div>
          <div className="table-row"><strong>Editor load</strong><span>&lt; 3.2s</span><Badge tone="good">OK</Badge></div>
          <div className="table-row"><strong>Canvas interaction</strong><span>&lt; 16ms frame</span><Badge tone="good">OK</Badge></div>
          <div className="table-row"><strong>Large file render</strong><span>&lt; 900ms</span><Badge tone="neutral">Watch</Badge></div>
        </div>
      </section>
    </div>
  );
}

function CommandPalette({ setActivePanel, setCommandOpen, setZoom }) {
  const commands = [
    ["Open canvas", () => setActivePanel("canvas")],
    ["Open code", () => setActivePanel("code")],
    ["Open AI", () => setActivePanel("ai")],
    ["Open exports", () => setActivePanel("exports")],
    ["Zoom in", () => setZoom((value) => Math.min(180, value + 8))],
    ["Zoom out", () => setZoom((value) => Math.max(40, value - 8))]
  ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="command-modal">
        <div className="command-input"><Command size={18} /><input autoFocus placeholder="Run command" /></div>
        {commands.map(([label, action]) => (
          <button key={label} type="button" onClick={() => { action(); setCommandOpen(false); }}>
            {label}
          </button>
        ))}
      </section>
    </div>
  );
}

function ShareModal({ file, setShareOpen }) {
  const { teamMembers } = useData();
  const [role, setRole] = useState("viewer");
  const [token, setToken] = useState(createShareToken(file.id, role));
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://drawai.local/share/${token}`;

  async function copyShareLink() {
    try {
      const share = await createShare(file.id, role).catch(() => null);
      const nextUrl = share?.url ?? shareUrl;
      await navigator.clipboard?.writeText(nextUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel">
        <PaneHeader title="Share file" icon={Share2} />
        <label>
          Role
          <select value={role} onChange={(event) => {
            setRole(event.target.value);
            setToken(createShareToken(file.id, event.target.value));
          }}>
            <option value="viewer">Viewer</option>
            <option value="commenter">Commenter</option>
            <option value="editor">Editor</option>
          </select>
        </label>
        <label>
          Public link
          <input readOnly value={shareUrl} />
        </label>
        <div className="table-list">
          {teamMembers.map((member) => (
            <div className="table-row" key={member.name}>
              <strong>{member.name}</strong>
              <span>{member.role}</span>
            </div>
          ))}
        </div>
        <div className="header-actions">
          <ActionButton onClick={() => setShareOpen(false)}>Close</ActionButton>
          <ActionButton tone="primary" onClick={copyShareLink}><Clipboard size={16} />{copied ? "Copied" : "Copy link"}</ActionButton>
        </div>
      </section>
    </div>
  );
}

function VersionDrawer({ setVersionsOpen }) {
  const { versions } = useData();
  const [restoredId, setRestoredId] = useState("");
  return (
    <div className="modal-backdrop drawer-backdrop" role="dialog" aria-modal="true">
      <aside className="drawer">
        <PaneHeader title="Version history" icon={History} />
        {versions.map((version) => (
          <div className="version-row" key={version.id}>
            <strong>{version.label}</strong>
            <span>{version.by} / {version.time}</span>
            <ActionButton onClick={() => setRestoredId(version.id)}>{restoredId === version.id ? "Restored" : "Restore"}</ActionButton>
          </div>
        ))}
        <ActionButton onClick={() => setVersionsOpen(false)}>Close</ActionButton>
      </aside>
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="metric-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Usage({ label, value, pct }) {
  return (
    <div className="usage-card">
      <strong>{label}</strong>
      <span>{value}</span>
      <progress value={pct} max="100" />
    </div>
  );
}

function MiniDiagram() {
  return (
    <svg viewBox="0 0 180 110" aria-hidden="true">
      <rect x="14" y="28" width="52" height="28" rx="6" />
      <rect x="108" y="16" width="56" height="28" rx="6" />
      <rect x="108" y="68" width="56" height="28" rx="6" />
      <path d="M66 42H108M66 42C82 42 86 82 108 82" />
    </svg>
  );
}

function formatSnippet(label) {
  const snippets = {
    H2: "## New section",
    H3: "### Detail",
    Quote: "> Important note",
    Code: "```\nconst diagram = true\n```",
    Table: "| Service | Owner |\n| --- | --- |\n| API | Platform |",
    Check: "- [ ] New task",
    Link: "[API docs](https://example.com)",
    Image: "![Architecture](image.png)",
    Embed: "<drawai-embed file=\"auth-architecture\" />"
  };

  return snippets[label] ?? "";
}

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportSvgAsPng(title, svgSource = null) {
  const svg = document.querySelector("#diagram-svg");
  const source = svgSource ?? svg?.outerHTML;
  if (!source) return;
  const canvas = document.createElement("canvas");
  const image = new window.Image();
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  canvas.width = 1900;
  canvas.height = 1080;
  image.onload = () => {
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.download = `${title}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  image.src = url;
}

export default App;
