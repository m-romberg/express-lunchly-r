"use strict";

const Router = require("express").Router;
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const axios = require("axios");
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

  console.log("newUser", newUser);
  console.log("{ username, password}", { username, password});

  const resp = await axios.post("/login", { username, password});

  console.log("resp", resp);
  const token = resp.data.token;
  console.log("token", token);

  return res.json({ token });
});


module.exports = router;