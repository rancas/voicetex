import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import sessionsRouter from "./routes/sessions.js";
import historyRouter from "./routes/history.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/sessions", sessionsRouter);
app.use("/api/sessions/:id/history", historyRouter);

// In production, serve the built frontend
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
