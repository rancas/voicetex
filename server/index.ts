import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import type { Server } from "http";
import sessionsRouter from "./routes/sessions.js";
import historyRouter from "./routes/history.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/sessions", sessionsRouter);
app.use("/api/sessions/:id/history", historyRouter);

// In production, serve the built frontend
if (process.env.NODE_ENV === "production") {
  const distPath = process.env.VOICETEX_DIST_PATH || path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export function startServer(port: number = 3001): Promise<Server> {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Backend server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

// Start directly when run as a standalone script
const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("server/index.ts") ||
    process.argv[1].endsWith("server/index.js"));

if (isMainModule) {
  const port = Number(process.env.PORT) || 3001;
  startServer(port);
}
