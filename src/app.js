const express = require("express");

const healthRouter = require("./routes/health.routes");
const authRouter = require("./routes/auth.routes");

const app = express();

app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);

app.use((error, req, res, next) => {
    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
    ) {
        return res.status(400).json({
            message: "Invalid JSON body"
        });
    }

    next(error);
});

module.exports = app;