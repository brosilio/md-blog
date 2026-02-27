require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const indexRouter = require("./routes/index");
const postRouter = require("./routes/post");
const loginRouter = require("./routes/login");
const adminRouter = require("./routes/admin");
const mediaRouter = require("./routes/media");
const trashRouter = require("./routes/trash");
const themeRouter = require("./routes/theme");

const app = express();
const PORT = process.env.APP_PORT || 3000;
const HOST = process.env.APP_HOST || "127.0.0.1";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(
	"/codemirror",
	express.static(path.join(__dirname, "..", "node_modules", "codemirror"))
);
if (process.env.MEDIA_DIRECTORY) {
	app.use("/media", express.static(process.env.MEDIA_DIRECTORY));
}
app.use(cookieParser());

app.get("/custom.css", async (req, res) => {
	const file = process.env.CUSTOM_CSS_FILE;
	if (!file) return res.type("css").send("");
	try {
		const css = await require("fs").promises.readFile(file, "utf-8");
		res.type("css").send(css);
	} catch {
		res.type("css").send("");
	}
});

app.use("/", indexRouter);
app.use("/", loginRouter);
app.use("/admin", adminRouter);
app.use("/admin", mediaRouter);
app.use("/admin", trashRouter);
app.use("/admin", themeRouter);
app.use("/post", postRouter);

app.listen(PORT, HOST, () => {
	console.log(`Server running at http://${HOST}:${PORT}`);
});
