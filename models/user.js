"use strict";

/** User of the site. */

const bcrypt = require("bcrypt");
const db = require("../db");
const { UnauthorizedError, NotFoundError, BadRequestError } = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config");

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */
  //TODO: update sql weirdness into try/catch
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
    if (!user) {
      throw new BadRequestError(`Did not create user ${username}.`);
    }

    await User.updateLoginTimestamp(user.username);
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
    if (!user) {
      throw new NotFoundError(`Could not find user ${username}.`);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */
  //TODO: when getting lots of data, give some structure! order by!
  static async all() {
    const results = await db.query(
      `SELECT username,
              first_name,
              last_name
        FROM users
        `
    );
    const users = results.rows;
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

    if (!user) {
      throw new NotFoundError(`User ${username} not found.`);
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
      `SELECT u.username,
              u.first_name,
              u.last_name,
              u.phone,
              m.id,
              m.body,
              m.sent_at,
              m.read_at
          FROM messages AS m
            INNER JOIN users AS u
            ON m.to_username = u.username
          WHERE from_username = $1`,
      [username]
    );
    const messagesData = mResults.rows;

    if (!messagesData) {
      throw new NotFoundError(`Could not find messages from ${username}.`);
    };

    const messagesWithToUserData = messagesData.map(m => ({
      id: m.id,
      to_user: {
        username: m.username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));

    return messagesWithToUserData;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const mResults = await db.query(
      `SELECT u.username,
              u.first_name,
              u.last_name,
              u.phone,
              m.id,
              m.body,
              m.sent_at,
              m.read_at
          FROM messages AS m
            INNER JOIN users AS u
            ON m.from_username = u.username
          WHERE to_username = $1`,
      [username]
    );
    const messagesData = mResults.rows;
    if (!messagesData) {
      throw new NotFoundError(`Could not find messages to ${username}.`);
    };

    const messagesWithFromUserData = messagesData.map(m => ({
      id: m.id,
      from_user: {
        username: m.username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));

    return messagesWithFromUserData;
  }
}


module.exports = User;


  // ##### Original non-optimized version #####
  // static async messagesFrom(username) {

  //   const mResults = await db.query(
  //     `SELECT id,
  //             to_username,
  //             body,
  //             sent_at,
  //             read_at
  //         FROM messages AS m
  //         WHERE from_username = $1`,
  //     [username]
  //   );
  //   const messages = mResults.rows;

  //   for (let msg of messages) {
  //     const to_username = msg.to_username;
  //     const uResults = await db.query(
  //       `SELECT username,
  //               first_name,
  //               last_name,
  //               phone
  //           FROM users
  //           WHERE username=$1`,
  //       [to_username]
  //     );
  //     const user = uResults.rows[0];
  //     delete msg.to_username;
  //     msg.to_user = user;
  //   };

  //   return messages;
  // }