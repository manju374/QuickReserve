const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const pgSession = require("connect-pg-simple")(session);
const db = require("./db")

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const adminAuthRoutes = require("./routes/adminAuth");

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new pgSession({
    pool: db,
    tableName: "session"
  }),
  secret: process.env.SESSION_SECRET || "secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 } 
}));

app.use(express.static(path.join(__dirname, "quickreserve", "public")));

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/admin-auth", adminAuthRoutes);

function requireUserLogin(req, res, next) {
  if (!req.session.userId) return res.redirect("/login.html");
  next();
}

function requireAdminLogin(req, res, next) {
  if (!req.session.adminId) {
    return res.redirect("/admin-login.html");
  }
  next();
}

app.get("/admin.html", requireAdminLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "quickreserve", "public", "admin.html"));
});


app.get("/mybookings.html", requireUserLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "quickreserve", "public", "mybookings.html"));
});

app.get("/admin.html", requireAdminLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "quickreserve", "public", "admin.html"));
});

app.get("/auth/status", (req, res) => {
  res.json({
    loggedIn: !!req.session.userId,
    adminLoggedIn: !!req.session.adminId,
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "quickreserve", "public", "index.html"));
});

app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
