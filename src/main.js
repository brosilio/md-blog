require("dotenv").config();

const express = require("express");
const path = require("path");

const indexRouter = require("./routes/index");
const postRouter = require("./routes/post");

const app = express();
const PORT = process.env.APP_PORT || 3000;
const HOST = process.env.APP_HOST || "127.0.0.1";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));

app.use("/", indexRouter);
app.use("/post", postRouter);

app.listen(PORT, HOST, () => {
	console.log(`Server running at http://${HOST}:${PORT}`);
});
