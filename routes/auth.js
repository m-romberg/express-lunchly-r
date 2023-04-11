"use strict";

const Router = require("express").Router;
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const router = new Router();

/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res) {
  const { username, password } = req.body;
  console.log("username", username, "password", password);
  const isAuthenticated = await User.authenticate(username, password);

  if (isAuthenticated === true) {
    const token = jwt.sign({ username }, SECRET_KEY);
    User.updateLoginTimestamp(username);
    return res.json({ token });
  }
  throw new UnauthorizedError(`Invalid username/password`);
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res) {
  const { username, password, first_name, last_name, phone } = req.body;
  console.log("req.body", req.body);
  // const newUser = await User.register(req.body);

  const newUser = await User.register({ username,
                        password,
                        first_name,
                        last_name,
                        phone });

  const token = jwt.sign({ username }, SECRET_KEY);
  return res.json({ token });
});


module.exports = router;