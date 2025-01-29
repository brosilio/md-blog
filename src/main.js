const express = require('express');
const path = require('path');

const indexRouter = require("./routes/index");
const postRouter = require("./routes/post");

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.use("/", indexRouter);
app.use("/post", postRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
