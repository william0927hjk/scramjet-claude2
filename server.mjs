import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createBareServer } from "@tomphttp/bare-server-node";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer();
const bare = createBareServer("/bare/", {
  logErrors: true,
  blockLocal: false,
});

const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "0.0.0.0";

app.use(
  express.static(path.join(__dirname, "node_modules", "@titaniumnetwork-dev", "ultraviolet", "dist")),
);
app.use(
  "/baremux",
  express.static(path.join(__dirname, "node_modules", "@mercuryworkshop", "bare-mux", "dist")),
);
app.use(
  "/bare-as-module3",
  express.static(path.join(__dirname, "node_modules", "@mercuryworkshop", "bare-as-module3", "dist")),
);
app.use(
  "/epoxy",
  express.static(path.join(__dirname, "node_modules", "@mercuryworkshop", "epoxy-transport", "dist")),
);

app.use("/service", (_request, response) => {
  response.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Opening Browser</title>
    <style>
      body {
        display: grid;
        min-height: 100vh;
        place-items: center;
        margin: 0;
        color: #17212b;
        background: #eef2f1;
        font-family: system-ui, sans-serif;
      }
      main {
        display: grid;
        gap: 10px;
        max-width: 420px;
        padding: 24px;
        text-align: center;
      }
      strong { font-size: 1.2rem; }
      p { margin: 0; color: #64726f; }
    </style>
  </head>
  <body>
    <main>
      <strong>Opening browser...</strong>
      <p id="status">Starting Ultraviolet</p>
    </main>
    <script src="/uv.bundle.js"></script>
    <script src="/uv.config.js"></script>
    <script type="module">
      const status = document.getElementById("status");
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/service/" });
        await navigator.serviceWorker.ready;
        const reloadKey = "uv-loader:" + location.pathname;
        if (sessionStorage.getItem(reloadKey)) {
          status.textContent = "Refresh once more if the page does not open.";
        } else {
          sessionStorage.setItem(reloadKey, "1");
          location.reload();
        }
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : "Browser setup failed.";
      }
    </script>
  </body>
</html>`);
});

if (isProduction) {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get(/.*/, (_request, response) => {
    response.sendFile(path.join(__dirname, "dist", "index.html"));
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    appType: "spa",
    server: { middlewareMode: true },
  });
  app.use(vite.middlewares);
}

server.on("request", (request, response) => {
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  if (bare.shouldRoute(request)) {
    bare.routeRequest(request, response);
    return;
  }

  app(request, response);
});

server.on("upgrade", (request, socket, head) => {
  if (bare.shouldRoute(request)) {
    bare.routeUpgrade(request, socket, head);
    return;
  }
  socket.end();
});

server.listen(port, host, () => {
  console.log(`Portal running at http://${host}:${port}`);
});
