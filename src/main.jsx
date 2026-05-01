import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AppWindow,
  ArrowRight,
  Compass,
  ExternalLink,
  Gamepad2,
  Globe2,
  Home,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import "./styles.css";

const apps = [
  { name: "Notes", tag: "Tools", accent: "#3d7bff" },
  { name: "Media", tag: "Player", accent: "#f15bb5" },
  { name: "Files", tag: "Storage", accent: "#00a884" },
  { name: "Chat", tag: "Social", accent: "#ffb703" },
];

const games = [
  { name: "2048", tag: "Puzzle", accent: "#ff7a59" },
  { name: "Slope", tag: "Arcade", accent: "#7c3aed" },
  { name: "Chess", tag: "Strategy", accent: "#2f4858" },
  { name: "Tetris", tag: "Classic", accent: "#0081a7" },
];

const proxyModes = {
  ultraviolet: {
    name: "Ultraviolet",
    endpoint: "/service/",
    example: "/service/https://example.com",
  },
  scramjet: {
    name: "Scramjet",
    endpoint: "/scramjet/",
    example: "Coming next",
  },
};

function encodeUltravioletUrl(url) {
  let encoded = "";

  for (let index = 0; index < url.length; index += 1) {
    encoded += index % 2 ? String.fromCharCode(url.charCodeAt(index) ^ 2) : url[index];
  }

  return encodeURIComponent(encoded);
}

async function setupBareMux() {
  const bareMuxUrl = "/baremux/index.mjs";
  const { BareMuxConnection } = await import(/* @vite-ignore */ bareMuxUrl);
  const connection = new BareMuxConnection("/baremux/worker.js");

  await connection.setTransport("/bare-as-module3/index.mjs", [
    new URL("/bare/", window.location.href).toString(),
  ]);
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes(".") && !trimmed.includes(" ")) return `https://${trimmed}`;
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

function Sidebar({ active, setActive }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "apps", label: "Apps", icon: AppWindow },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "browser", label: "Browser", icon: Globe2 },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Compass size={20} />
        </span>
        <span>Portal</span>
      </div>

      <nav className="nav-list" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={active === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => setActive(item.id)}
              type="button"
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <ShieldCheck size={18} />
        <span>Proxy-ready shell</span>
      </div>
    </aside>
  );
}

function TileGrid({ items }) {
  return (
    <div className="tile-grid">
      {items.map((item) => (
        <button className="tile" key={item.name} type="button">
          <span className="tile-icon" style={{ "--accent": item.accent }}>
            <Star size={18} fill="currentColor" />
          </span>
          <span>
            <strong>{item.name}</strong>
            <small>{item.tag}</small>
          </span>
          <ArrowRight size={17} />
        </button>
      ))}
    </div>
  );
}

function BrowserPanel() {
  const [mode, setMode] = useState("ultraviolet");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("Ready");
  const [isLaunching, setIsLaunching] = useState(false);
  const selected = proxyModes[mode];

  async function submit(event) {
    event.preventDefault();
    const normalized = normalizeUrl(address);
    if (!normalized || isLaunching) {
      return;
    }

    if (mode === "scramjet") {
      setStatus("Scramjet is not installed yet. Ultraviolet is wired locally.");
      return;
    }

    setIsLaunching(true);
    setStatus("Opening...");

    try {
      await setupBareMux();
      window.location.href = `/service/${encodeUltravioletUrl(normalized)}`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Browser setup failed.");
      setIsLaunching(false);
    }
  }

  return (
    <section className="browser-panel">
      <div className="section-heading">
        <span className="heading-icon">
          <Globe2 size={22} />
        </span>
        <div>
          <h2>Browser</h2>
          <p>Choose the proxy backend, then launch a URL or search query.</p>
        </div>
      </div>

      <div className="segmented" aria-label="Proxy backend">
        {Object.entries(proxyModes).map(([key, option]) => (
          <button
            className={mode === key ? "segment active" : "segment"}
            key={key}
            onClick={() => setMode(key)}
            type="button"
          >
            {option.name}
          </button>
        ))}
      </div>

      <form className="browser-bar" onSubmit={submit}>
        <Search size={20} />
        <input
          aria-label="Address or search"
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Search or enter a website"
          value={address}
        />
        <button type="submit">
          <ExternalLink size={18} />
          <span>{isLaunching ? "Opening" : "Go"}</span>
        </button>
      </form>

      <div className={status === "Ready" ? "browser-status" : "browser-status active"}>
        {status}
      </div>

      <div className="proxy-details">
        <div>
          <strong>{selected.name} route</strong>
          <code>{selected.endpoint}</code>
        </div>
        <div>
          <strong>Example launch</strong>
          <code>{selected.example}</code>
        </div>
      </div>
    </section>
  );
}

function Content({ active }) {
  if (active === "apps") {
    return (
      <main className="content">
        <SectionIntro icon={AppWindow} title="Apps" text="Quick launch area for tools you add to the portal." />
        <TileGrid items={apps} />
      </main>
    );
  }

  if (active === "games") {
    return (
      <main className="content">
        <SectionIntro icon={Gamepad2} title="Games" text="A compact launcher for hosted games and local embeds." />
        <TileGrid items={games} />
      </main>
    );
  }

  if (active === "browser") {
    return (
      <main className="content">
        <BrowserPanel />
      </main>
    );
  }

  return (
    <main className="content">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} />
            Personal portal
          </span>
          <h1>Apps, games, and a proxy-ready browser in one place.</h1>
          <p>
            The sidebar is wired up now. Add your app links, game embeds, and connect either
            Scramjet or Ultraviolet when you are ready to run the proxy server.
          </p>
        </div>
        <div className="status-panel">
          <div>
            <Settings size={20} />
            <span>Node.js frontend</span>
          </div>
          <strong>Ready for backend routes</strong>
        </div>
      </section>
      <div className="overview-grid">
        <FeatureCard icon={AppWindow} title="Apps" text="Add utility links, tools, and embeds." />
        <FeatureCard icon={Gamepad2} title="Games" text="Collect games behind a clean launcher." />
        <FeatureCard icon={Globe2} title="Browser" text="Switch between Scramjet and Ultraviolet routes." />
      </div>
    </main>
  );
}

function SectionIntro({ icon: Icon, title, text }) {
  return (
    <section className="section-intro">
      <span className="heading-icon">
        <Icon size={22} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <article className="feature-card">
      <Icon size={24} />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function App() {
  const [active, setActive] = useState("home");

  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} />
      <Content active={active} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
