require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.post("/api/upload", require("./routes/upload"));
app.post("/api/logActivity", require("./routes/logActivity"));
app.post("/api/login", require("./routes/auth").login);
app.post("/api/signup", require("./routes/auth").signup);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
