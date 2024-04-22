const User = require("../models/usermodel");

const islogin = async (req, res, next) => {
  try {
    if (req.session.admin) {
      next();
    } else {
      res.redirect("/admin");
    }
  } catch (error) {}
};

const islogout = async (req, res, next) => {
  try {
    if (req.session.admin) {
      res.redirect("/admin/dashboard");
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  islogin,
  islogout,
};
