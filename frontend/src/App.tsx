import {
  Bot,
  CircleUserRound,
  Download,
  FileText,
  Folder,
  GitBranch,
  MessageSquare,
  MousePointer2,
  PanelRight,
  PenLine,
  Plus,
  Search,
  Share2,
  Sparkles,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import "./App.css";

const files = [
  { name: "Auth architecture", kind: "System diagram", active: true },
  { name: "Billing flow", kind: "Sequence" },
  { name: "Workspace schema", kind: "ERD" }
];

const comments = [
  { author: "Maya", text: "Check retry path" },
  { author: "Dev", text: "Add webhook branch" }
];

function IconButton({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label}>
      {children}
    </button>
  );
}

function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <div className="brand-row">
          <div className="brand-mark">D</div>
          <div>
            <strong>DrawAI</strong>
            <span>Product</span>
          </div>
        </div>

        <button className="new-file-button" type="button">
          <Plus size={16} />
          New file
        </button>

        <label className="search-box">
          <Search size={16} />
          <input type="search" placeholder="Search files" />
        </label>

        <nav className="sidebar-section" aria-label="Files">
          <span className="section-label">Files</span>
          {files.map((file) => (
            <button
              className={file.active ? "file-row is-active" : "file-row"}
              key={file.name}
              type="button"
            >
              <FileText size={16} />
              <span>
                <strong>{file.name}</strong>
                <small>{file.kind}</small>
              </span>
            </button>
          ))}
        </nav>

        <nav className="sidebar-section" aria-label="Templates">
          <span className="section-label">Templates</span>
          <button className="simple-row" type="button">
            <Folder size={16} />
            Cloud systems
          </button>
          <button className="simple-row" type="button">
            <GitBranch size={16} />
            API flows
          </button>
        </nav>

        <div className="empty-state" role="status">
          <span className="section-label">Shared</span>
          <p>No shared files</p>
        </div>

        <button className="account-menu" type="button" aria-label="Account menu">
          <CircleUserRound size={18} />
          <span>
            <strong>Founder</strong>
            <small>drawai.local</small>
          </span>
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Architecture Workspace</span>
            <h1>Auth architecture</h1>
          </div>
          <div className="topbar-actions">
            <button className="action-button" type="button">
              <Sparkles size={16} />
              AI
            </button>
            <button className="action-button" type="button">
              <Download size={16} />
              Export
            </button>
            <button className="primary-button" type="button">
              <Share2 size={16} />
              Share
            </button>
          </div>
        </header>

        <div className="editor-grid">
          <section className="doc-pane" aria-label="Document">
            <div className="pane-header">
              <span>Design notes</span>
              <IconButton label="Open document tools">
                <PanelRight size={16} />
              </IconButton>
            </div>

            <article className="document">
              <h2>Authentication flow</h2>
              <p>
                The client exchanges credentials with the API gateway, then stores
                a short-lived session token after workspace membership checks pass.
              </p>
              <h3>Services</h3>
              <ul>
                <li>API gateway validates incoming requests.</li>
                <li>Auth service owns sessions and invite acceptance.</li>
                <li>Workspace service resolves roles and file permissions.</li>
              </ul>
            </article>
          </section>

          <section className="canvas-pane" aria-label="Canvas">
            <div className="canvas-toolbar" aria-label="Canvas tools">
              <IconButton label="Select">
                <MousePointer2 size={16} />
              </IconButton>
              <IconButton label="Draw">
                <PenLine size={16} />
              </IconButton>
              <IconButton label="Zoom out">
                <ZoomOut size={16} />
              </IconButton>
              <span className="zoom-label">92%</span>
              <IconButton label="Zoom in">
                <ZoomIn size={16} />
              </IconButton>
            </div>

            <div className="canvas-surface">
              <svg viewBox="0 0 760 480" role="img" aria-label="Authentication architecture diagram">
                <defs>
                  <marker
                    id="arrow"
                    markerHeight="8"
                    markerWidth="8"
                    orient="auto"
                    refX="7"
                    refY="4"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="#37515d" />
                  </marker>
                </defs>

                <path className="grid-line" d="M60 80H700M60 200H700M60 320H700" />
                <path className="grid-line" d="M150 40V430M350 40V430M550 40V430" />

                <g className="diagram-node">
                  <rect x="78" y="152" width="156" height="76" rx="8" />
                  <text x="156" y="184">Web client</text>
                  <text x="156" y="205" className="muted-text">React app</text>
                </g>

                <g className="diagram-node accent-node">
                  <rect x="304" y="152" width="156" height="76" rx="8" />
                  <text x="382" y="184">API gateway</text>
                  <text x="382" y="205" className="muted-text">Express</text>
                </g>

                <g className="diagram-node success-node">
                  <rect x="530" y="94" width="156" height="76" rx="8" />
                  <text x="608" y="126">Auth service</text>
                  <text x="608" y="147" className="muted-text">Sessions</text>
                </g>

                <g className="diagram-node warn-node">
                  <rect x="530" y="246" width="156" height="76" rx="8" />
                  <text x="608" y="278">Workspace DB</text>
                  <text x="608" y="299" className="muted-text">Postgres</text>
                </g>

                <path className="connector" d="M234 190H304" />
                <path className="connector" d="M460 176C490 176 496 132 530 132" />
                <path className="connector" d="M460 204C490 204 496 284 530 284" />
              </svg>
            </div>
          </section>

          <aside className="inspector" aria-label="Inspector">
            <div className="pane-header">
              <span>Activity</span>
              <MessageSquare size={16} />
            </div>
            <div className="ai-panel">
              <Bot size={18} />
              <span>Diagram draft ready</span>
            </div>
            {comments.map((comment) => (
              <div className="comment" key={`${comment.author}-${comment.text}`}>
                <strong>{comment.author}</strong>
                <p>{comment.text}</p>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </main>
  );
}

export default App;
