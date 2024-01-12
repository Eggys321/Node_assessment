const jwt = require("jsonwebtoken");
const moment = require('moment');
const rateLimit = require('express-rate-limit')
const USER = require('../model/userModel')
// import { rateLimit } from 'express-rate-limit'


// const bodyParser = require('body-parser');





// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// In-memory dictionary to store user authentication attempts
const authAttempts = {};

// Configuration for suspension policy
const MAX_FAILED_ATTEMPTS = 3;
const SUSPENSION_DURATION_MINUTES = 7;

// const limiter = rateLimit({
// 	windowMs: 7 * 60 * 1000, 
// 	limit: 7,
// 	standardHeaders: 'draft-7',
// 	legacyHeaders: false, 
// })

// app.use(limiter)
// Apply the rate limiting middleware to all requests.

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ message: "unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRETE);
    req.user = { userId: payload.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Auth Failed" });
  }
};

// Middleware to check user suspension status
function checkSuspension(req, res, next) {
  const { firstname } = req.body;

  if (
    authAttempts[firstname] &&
    authAttempts[firstname].suspensionTime > moment()
  ) {
    return res
      .status(403)
      .json({ error: "User suspended due to authentication abuse." });
  }

  next();
}


// Middleware to handle authentication abuse protection
function authenticationAbuseProtection(req, res, next) {
  const { email, password } = req.body;

  if (!authAttempts[email]) {
    authAttempts[email] = { failedAttempts: 0, suspensionTime: null };
  }

  if (authAttempts[email].failedAttempts >= MAX_FAILED_ATTEMPTS) {
    authAttempts[email].suspensionTime = moment().add(
      SUSPENSION_DURATION_MINUTES,
    // limiter,
      "minutes"
    );
    return res
      .status(403)
      .json({ error: "User suspended due to authentication abuse." });
  }

  if (authenticateUser(email, password)) {
    authAttempts[email].failedAttempts = 0;
    next();
  } else {
    authAttempts[email].failedAttempts++;
    return res.status(401).json({ error: "Invalid credentials." });
  }
}

async function authenticateUser(email, password) {
    // const {email,password} = req.body
    const userEmail = await USER.findOne({email});
    const userPassword = await USER.findOne({password});

    return email === userEmail  && password === userPassword 
  }
module.exports = {
  auth,
  checkSuspension,
  authenticationAbuseProtection,
};
