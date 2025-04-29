const dotenv = require("dotenv").config();
const { errorHandler, notFound } = require('./middleware/errorHandler');


const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL);

const express = require("express");
const app = express();

const flash = require("express-flash");

const session = require("express-session");

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

const nocache = require("nocache");
app.use(nocache());

app.use(flash());

app.use(
  session({
    secret: "123@#",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// user route  requiring

const userroute = require("./routers/user_routers");

app.use("/", userroute);

// for admin requiring

const adminroutes = require("./routers/admin_routers");

app.use("/admin", adminroutes);

// Catch-all route should be before error handlers
app.get("*", (req, res) => {
  res.redirect("/error");
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`server is running http://localhost:${PORT}`);
});
