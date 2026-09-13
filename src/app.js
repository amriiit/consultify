const express = require("express");

const healthRouter = require("./routes/health.routes");
const authRouter = require("./routes/auth.routes");

const app = express();

app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);

module.exports = app;