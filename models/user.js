"use strict";

/** User of the site. */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { UnauthorizedError, NotFoundError } = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config");

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    //console.log("@@@ RESULTS:",results.rows);
    const user = results.rows[0];
    if (!user){
      throw new Error(`Did not create user ${username}.`);
    }
    User.updateLoginTimestamp(user.username);
    return user;
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1`,
      [username]);
    const user = results.rows[0];
    console.log("@@@ User:", user);
    if (user) {
      if (await bcrypt.compare(password, user.password) === true) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const results = await db.query(
      `UPDATE users
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE username=$1
        RETURNING username`,
        [username]
    );
    const user = results.rows[0];
    if (!user){
      throw new Error();
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username,
              first_name,
              last_name
        FROM users
        `
    );
    const users = results.rows;

    if (!users){
      throw new Error(`Users not found.`);
    }
    return users;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
        FROM users
        WHERE username=$1`, [username]
    );
    const user = results.rows[0];

    if (!user){
      throw new Error(`User ${username} not found.`);
    }
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const mResults = await db.query(
      `SELECT id,
              to_username,
              body,
              sent_at,
              read_at
          FROM messages AS m
          WHERE from_username = $1`,
      [username]
    );
    const messages = mResults.rows;

    for (let msg of messages) {
      const to_username = msg.to_username;
      const uResults = await db.query(
        `SELECT username,
                first_name,
                last_name,
                phone
            FROM users
            WHERE username=$1`,
        [to_username]
      );
      const user = uResults.rows[0];
      delete msg.to_username;
      msg.to_user = user;
    };

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}


module.exports = User;