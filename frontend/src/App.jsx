import { useEffect, useMemo, useState } from "react";
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
  apiKeys,
  comments as seedComments,
  files,
  integrations,
  plans,
  teamMembers,
  templates,
  versions,
  workspace
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
import { can, createShareToken, getRoleLabel } from "./lib/permissions.js";
import "./App.css";

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
  const [activeFileId, setActiveFileId] = useState("auth-architecture");
  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0];
  const page = route.split("/")[0];

  function openFile(fileId) {
    setActiveFileId(fileId);
    navigate(`editor/${fileId}`);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <button className="brand-row" type="button" onClick={() => navigate("dashboard")}>
          <div className="brand-mark">D</div>
          <span>
            <strong>DrawAI</strong>
            <small>{workspace.plan}</small>
          </span>
        </button>

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
          {files.filter((file) => file.status === "active").slice(0, 3).map((file) => (
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
            <strong>{workspace.owner}</strong>
            <small>{workspace.domain}</small>
          </span>
          <ChevronDown size={14} />
        </button>
      </aside>

      <section className="workspace">
        {page === "auth" ? (
          <AuthView route={route} />
        ) : page === "editor" ? (
          <EditorView file={activeFile} />
        ) : page === "share" ? (
          <PublicShareView file={activeFile} />
        ) : page === "integrations" ? (
          <IntegrationsView />
        ) : page === "billing" ? (
          <BillingAdminView />
        ) : page === "quality" ? (
          <QualityView />
        ) : (
          <DashboardView onOpenFile={openFile} />
        )}
      </section>
    </main>
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
  const mode = route.split("/")[1] || "signin";
  const [team, setTeam] = useState(workspace.slug);

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
        <form className="form-panel">
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
          <ActionButton tone="primary">
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

function DashboardView({ onOpenFile }) {
  const [tab, setTab] = useState("recent");
  const views = {
    recent: files.filter((file) => file.status === "active"),
    folders: [
      { title: "Architecture", kind: "3 files", id: "folder-architecture" },
      { title: "Payments", kind: "2 files", id: "folder-payments" },
      { title: "Data model", kind: "4 files", id: "folder-data" }
    ],
    templates: templates.map((title) => ({ title, kind: "Template", id: title })),
    shared: files.filter((file) => file.shared),
    trash: files.filter((file) => file.status === "trash")
  };

  return (
    <div className="screen">
      <SectionHeader
        eyebrow={workspace.name}
        title="Dashboard"
        actions={
          <>
            <ActionButton>
              <Bell size={16} />
              Notifications
            </ActionButton>
            <ActionButton tone="primary" onClick={() => onOpenFile("auth-architecture")}>
              <Plus size={16} />
              New file
            </ActionButton>
          </>
        }
      />

      <div className="metric-grid">
        <Metric label="Active files" value="18" icon={FileText} />
        <Metric label="AI credits" value="1,240" icon={Sparkles} />
        <Metric label="Exports" value="86" icon={Download} />
        <Metric label="Collaborators" value="12" icon={Users} />
      </div>

      <div className="tab-row">
        {["recent", "folders", "templates", "shared", "trash"].map((id) => (
          <button className={tab === id ? "tab is-active" : "tab"} key={id} type="button" onClick={() => setTab(id)}>
            {id}
          </button>
        ))}
      </div>

      <section className="card-grid">
        {views[tab].map((item) => (
          <button className="resource-card" key={item.id} type="button" onClick={() => item.title && onOpenFile(item.id)}>
            <div className="resource-preview">
              <MiniDiagram />
            </div>
            <strong>{item.title}</strong>
            <span>{item.kind ?? item.folder}</span>
            {"updated" in item ? <small>{item.updated} by {item.owner}</small> : null}
          </button>
        ))}
      </section>
    </div>
  );
}

function EditorView({ file }) {
  const storageKey = `drawai:${file.id}`;
  const persisted = readStorage(storageKey);
  const [title, setTitle] = useState(persisted.title ?? file.title);
  const [markdown, setMarkdown] = useState(persisted.markdown ?? defaultMarkdown);
  const [diagramDsl, setDiagramDsl] = useState(persisted.diagramDsl ?? diagramExamples.architecture);
  const [activePanel, setActivePanel] = useState("canvas");
  const [tool, setTool] = useState("select");
  const [zoom, setZoom] = useState(Number(persisted.zoom ?? 92));
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState("API gateway");
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
  const [commentList, setCommentList] = useState(seedComments);
  const [newComment, setNewComment] = useState("");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const diagram = useMemo(() => parseDiagramDsl(diagramDsl), [diagramDsl]);
  const nodes = useMemo(() => diagramLayout(diagram.nodes), [diagram.nodes]);
  const blocks = useMemo(() => markdownToBlocks(markdown), [markdown]);
  const credits = estimateAiCredits(aiPrompt, "generate");

  useEffect(() => {
    setAutosave("Saving");
    const timer = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({ title, markdown, diagramDsl, zoom }));
      setAutosave("Saved");
    }, 450);

    return () => window.clearTimeout(timer);
  }, [storageKey, title, markdown, diagramDsl, zoom]);

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
    window.setTimeout(() => {
      setReviewDsl(`diagram ${aiMode.toLowerCase().replace(" ", "-")}
Web client -> API gateway: signup request
API gateway -> Auth service: create session
Auth service -> Workspace DB: resolve role
API gateway -> Export worker: permission check
Export worker -> Object storage: store artifact`);
      setAiState("review");
    }, 700);
  }

  function startExport(format) {
    setExportJob({ format, progress: 25, status: "Preparing" });
    window.setTimeout(() => setExportJob({ format, progress: 72, status: "Rendering" }), 250);
    window.setTimeout(() => {
      if (format === "Markdown") downloadText(`${title}.md`, buildMarkdownExport({ title, markdown, diagramDsl }));
      if (format === "HTML") downloadText(`${title}.html`, buildHtmlExport({ title, markdown }));
      if (format === "SVG") downloadText(`${title}.svg`, document.querySelector("#diagram-svg")?.outerHTML ?? "");
      if (format === "PNG") exportSvgAsPng(title);
      if (format === "Clipboard") navigator.clipboard?.writeText(buildMarkdownExport({ title, markdown, diagramDsl }));
      if (format === "PDF") window.print();
      setExportJob({ format, progress: 100, status: "Complete" });
    }, 600);
  }

  function addComment() {
    if (!newComment.trim()) return;
    setCommentList((items) => [
      { id: `c${items.length + 1}`, author: "Founder", target: selectedNode, text: newComment, status: "open" },
      ...items
    ]);
    setNewComment("");
  }

  return (
    <div className="editor-shell">
      <header className="editor-topbar">
        <div className="breadcrumbs">
          <span>{workspace.name}</span>
          <span>/</span>
          <span>{file.folder}</span>
          <span>/</span>
          <input className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="topbar-actions">
          <Badge tone={autosave === "Saved" ? "good" : "warn"}>{autosave}</Badge>
          <select value={state} onChange={(event) => setState(event.target.value)}>
            {editorStates.map((item) => <option key={item}>{item}</option>)}
          </select>
          <ActionButton onClick={() => setCommandOpen(true)}>
            <Command size={16} />
            Command
          </ActionButton>
          <ActionButton onClick={() => setVersionsOpen(true)}>
            <History size={16} />
            History
          </ActionButton>
          <ActionButton onClick={() => startExport("Markdown")}>
            <Save size={16} />
            Save
          </ActionButton>
          <ActionButton tone="primary" onClick={() => setShareOpen(true)}>
            <Share2 size={16} />
            Share
          </ActionButton>
        </div>
      </header>

      {state !== "Normal" ? <StateBanner state={state} /> : null}

      <div className="editor-grid">
        <aside className="document-pane">
          <PaneHeader title="Document" icon={FileText} />
          <div className="format-toolbar">
            {["H2", "H3", "Quote", "Code", "Table", "Check", "Link", "Image", "Embed"].map((label) => (
              <button key={label} type="button" onClick={() => setMarkdown((value) => `${value}\n${formatSnippet(label)}`)}>
                {label}
              </button>
            ))}
          </div>
          <label className="find-box">
            <Search size={15} />
            <input value={findText} onChange={(event) => setFindText(event.target.value)} placeholder="Find in document" />
          </label>
          <textarea
            className="markdown-editor"
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            spellCheck="true"
          />
          <div className="outline-list">
            <span className="section-label">Outline</span>
            {blocks.filter((block) => ["h2", "h3"].includes(block.type)).map((block, index) => (
              <button className={findText && block.text.toLowerCase().includes(findText.toLowerCase()) ? "outline-hit" : ""} key={`${block.text}-${index}`} type="button">
                <PanelRight size={13} />
                {block.text}
              </button>
            ))}
          </div>
          <div className="block-preview">
            {blocks.slice(0, 6).map((block, index) => (
              <div className="block-row" key={`${block.type}-${index}`}>
                <span className="drag-handle">::</span>
                <span>{block.type}</span>
                <p>{block.text}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="editor-main">
          <div className="panel-tabs">
            {["canvas", "code", "ai", "exports"].map((panel) => (
              <button className={activePanel === panel ? "tab is-active" : "tab"} key={panel} type="button" onClick={() => setActivePanel(panel)}>
                {panel}
              </button>
            ))}
          </div>

          {activePanel === "canvas" ? (
            <CanvasPanel
              diagram={diagram}
              fill={fill}
              lineWidth={lineWidth}
              nodes={nodes}
              opacity={opacity}
              pan={pan}
              radius={radius}
              selectedNode={selectedNode}
              setPan={setPan}
              setSelectedNode={setSelectedNode}
              setTool={setTool}
              setZoom={setZoom}
              stroke={stroke}
              tool={tool}
              zoom={zoom}
            />
          ) : activePanel === "code" ? (
            <CodePanel diagram={diagram} diagramDsl={diagramDsl} setDiagramDsl={setDiagramDsl} />
          ) : activePanel === "ai" ? (
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
            />
          ) : (
            <ExportPanel exportJob={exportJob} setExportJob={setExportJob} startExport={startExport} />
          )}
        </section>

        <aside className="inspector">
          <PaneHeader title="Inspector" icon={Settings} />
          <div className="inspector-section">
            <span className="section-label">Selection</span>
            <strong>{selectedNode}</strong>
            <div className="style-grid">
              <label>
                Fill
                <input type="color" value={fill} onChange={(event) => setFill(event.target.value)} />
              </label>
              <label>
                Stroke
                <input type="color" value={stroke} onChange={(event) => setStroke(event.target.value)} />
              </label>
              <label>
                Width
                <input type="number" min="1" max="8" value={lineWidth} onChange={(event) => setLineWidth(Number(event.target.value))} />
              </label>
              <label>
                Radius
                <input type="number" min="0" max="24" value={radius} onChange={(event) => setRadius(Number(event.target.value))} />
              </label>
              <label>
                Opacity
                <input type="range" min="25" max="100" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} />
              </label>
            </div>
            <div className="quick-actions">
              <ActionButton><Copy size={15} />Duplicate</ActionButton>
              <ActionButton><RotateCw size={15} />Rotate</ActionButton>
              <ActionButton><Lock size={15} />Lock</ActionButton>
              <ActionButton><Archive size={15} />Archive</ActionButton>
            </div>
          </div>

          <div className="inspector-section">
            <span className="section-label">Collaboration</span>
            <div className="presence-row">
              {teamMembers.map((member) => (
                <span className="avatar" style={{ background: member.color }} key={member.name} title={`${member.name} - ${member.role}`}>
                  {member.name[0]}
                </span>
              ))}
            </div>
            <div className="comment-list">
              {commentList.map((comment) => (
                <div className={comment.status === "resolved" ? "comment is-resolved" : "comment"} key={comment.id}>
                  <strong>{comment.author}</strong>
                  <small>{comment.target}</small>
                  <p>{comment.text}</p>
                  <button type="button" onClick={() => setCommentList((items) => items.map((item) => item.id === comment.id ? { ...item, status: "resolved" } : item))}>
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
        </aside>
      </div>

      {commandOpen ? <CommandPalette setActivePanel={setActivePanel} setCommandOpen={setCommandOpen} setZoom={setZoom} /> : null}
      {shareOpen ? <ShareModal file={file} setShareOpen={setShareOpen} /> : null}
      {versionsOpen ? <VersionDrawer setVersionsOpen={setVersionsOpen} /> : null}
    </div>
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
            <ActionButton tone="primary" onClick={() => { setDiagramDsl(reviewDsl); setAiState("idle"); }}>
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
  const [repo, setRepo] = useState("drawai/core-platform");
  const [branch, setBranch] = useState("main");
  const [path, setPath] = useState("/src/auth");
  const [syncStatus, setSyncStatus] = useState("Clean");
  const [apiKeyList, setApiKeyList] = useState(apiKeys);

  return (
    <div className="screen">
      <SectionHeader eyebrow="Connected workspace" title="Integrations" actions={<ActionButton tone="primary"><Plus size={16} />Connect</ActionButton>} />
      <section className="integration-grid">
        {integrations.map((integration) => (
          <div className="integration-card" key={integration.id}>
            <div>
              <strong>{integration.name}</strong>
              <p>{integration.detail}</p>
            </div>
            <Badge tone={integration.tone}>{integration.status}</Badge>
            {integration.tone === "warn" ? <ActionButton><RefreshCw size={15} />Reconnect</ActionButton> : null}
          </div>
        ))}
      </section>

      <div className="two-column">
        <section className="panel">
          <PaneHeader title="Codebase diagram" icon={GitBranch} />
          <label>Repository<input value={repo} onChange={(event) => setRepo(event.target.value)} /></label>
          <label>Branch<input value={branch} onChange={(event) => setBranch(event.target.value)} /></label>
          <label>Paths<input value={path} onChange={(event) => setPath(event.target.value)} /></label>
          <ActionButton tone="primary"><Sparkles size={16} />Generate diagram</ActionButton>
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
  return (
    <div className="screen">
      <SectionHeader eyebrow="Workspace controls" title="Billing & admin" />
      <section className="pricing-grid">
        {plans.map((plan) => (
          <div className={plan.current ? "plan-card is-current" : "plan-card"} key={plan.name}>
            <Badge tone={plan.current ? "good" : "neutral"}>{plan.current ? "Current" : "Available"}</Badge>
            <h2>{plan.name}</h2>
            <strong>{plan.price}</strong>
            <p>{plan.limit}</p>
            <ActionButton tone={plan.current ? "default" : "primary"}>{plan.current ? "Manage" : "Checkout"}</ActionButton>
          </div>
        ))}
      </section>
      <div className="two-column">
        <section className="panel">
          <PaneHeader title="Team settings" icon={Users} />
          <div className="table-list">
            {teamMembers.map((member) => (
              <div className="table-row" key={member.name}>
                <span className="avatar" style={{ background: member.color }}>{member.name[0]}</span>
                <strong>{member.name}</strong>
                <select defaultValue={member.role.toLowerCase()}>
                  <option value="owner">Owner</option>
                  <option value="editor">Editor</option>
                  <option value="commenter">Commenter</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            ))}
          </div>
          <label>Allowed domain<input defaultValue="drawai.local" /></label>
        </section>
        <section className="panel">
          <PaneHeader title="Enterprise" icon={ShieldCheck} />
          {["SAML SSO", "SCIM provisioning", "Audit logs", "Data retention", "Allowed integrations"].map((item) => (
            <label className="toggle-row" key={item}>
              <input type="checkbox" defaultChecked={item !== "SCIM provisioning"} />
              {item}
            </label>
          ))}
        </section>
      </div>
      <section className="panel">
        <PaneHeader title="Usage and limits" icon={Activity} />
        <div className="usage-grid">
          <Usage label="AI credits" value="1,240 / 2,000" pct="62" />
          <Usage label="API calls" value="18,204 / 50,000" pct="36" />
          <Usage label="Exports" value="86 / 500" pct="17" />
          <Usage label="Version history" value="42 / 90 days" pct="47" />
        </div>
      </section>
    </div>
  );
}

function QualityView() {
  return (
    <div className="screen">
      <SectionHeader eyebrow="Frontend readiness" title="Quality" actions={<ActionButton tone="primary"><Check size={16} />Run checks</ActionButton>} />
      <section className="quality-grid">
        {[
          ["Unit tests", "editor utilities, permissions, formatting, diagram parsing", "Ready"],
          ["Component tests", "dashboard, auth, editor, export, share modal", "Scaffolded"],
          ["Playwright", "signup, file creation, AI generation, export, share link, comments", "Scaffolded"],
          ["Visual regression", "canvas, docs, exports, public viewer", "Scaffolded"],
          ["Accessibility", "keyboard navigation, focus, contrast, labels", "Passing"],
          ["Performance", "initial load, editor load, canvas interaction, large files", "Budgeted"]
        ].map(([title, detail, status]) => (
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
  const [role, setRole] = useState("viewer");
  const [token, setToken] = useState(createShareToken(file.id, role));

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
          <input readOnly value={`https://drawai.local/share/${token}`} />
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
          <ActionButton tone="primary"><Clipboard size={16} />Copy link</ActionButton>
        </div>
      </section>
    </div>
  );
}

function VersionDrawer({ setVersionsOpen }) {
  return (
    <div className="modal-backdrop drawer-backdrop" role="dialog" aria-modal="true">
      <aside className="drawer">
        <PaneHeader title="Version history" icon={History} />
        {versions.map((version) => (
          <div className="version-row" key={version.id}>
            <strong>{version.label}</strong>
            <span>{version.by} · {version.time}</span>
            <ActionButton>Restore</ActionButton>
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

function exportSvgAsPng(title) {
  const svg = document.querySelector("#diagram-svg");
  if (!svg) return;
  const canvas = document.createElement("canvas");
  const image = new window.Image();
  const source = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  canvas.width = 1520;
  canvas.height = 960;
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
