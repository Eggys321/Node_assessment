const express = require("express");
const {
  registration,
  login,
  logout,
  forgotPassword,
  resetPassword,
  allUsers,
} = require("../controllers/userController");
const {
  checkSuspension,
  authenticationAbuseProtection,
} = require("../middleware/auth");
const isAdmin = require('../middleware/isAdmin')
const router = express.Router();

// register route
router.post("/registration", registration);

// login route
router.post("/login",checkSuspension,authenticationAbuseProtection, login);

// logout route
router.get("/logout", logout);

// forgot password route
router.post("/forgotpassword", forgotPassword);

// reset password route
router.put("/resetpassword/:resetToken", resetPassword);
// to get all users
router.get('/allusers',isAdmin,allUsers)

module.exports = router;
