"use strict";

/** Add seed users and messages to messagely db */

const bcrypt = require("bcrypt");
const db = require("./db");
const { BCRYPT_WORK_FACTOR } = require("./config");


let seedUsers;

async function fillUsers() {
  const hashedPw1 = await bcrypt.hash('pass1', BCRYPT_WORK_FACTOR);
  const hashedPw2 = await bcrypt.hash('pass2', BCRYPT_WORK_FACTOR);

  seedUsers = [
    {
      username: 'user1',
      password: hashedPw1,
      first_name: 'first1',
      last_name: 'last1',
      phone: '1111111',
    },
    {
      username: 'user2',
      password: hashedPw2,
      first_name: 'first2',
      last_name: 'last2',
      phone: '2222222',
    }
  ];
}

const seedMessages = [
  {
    from_username: 'user1',
    to_username: 'user2',
    body: '1-to-2',
  },
  {
    from_username: 'user2',
    to_username: 'user1',
    body: '2-to-1',
  }
];


async function insertToDb() {
  for (let u of seedUsers) {
    await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5)`,
      [u.username, u.password, u.first_name, u.last_name, u.phone]
    );
  }

  for (let m of seedMessages) {
    await db.query(
      `INSERT INTO messages (from_username,
                             to_username,
                             body,
                             sent_at)
         VALUES
           ($1, $2, $3, current_timestamp)`,
      [m.from_username, m.to_username, m.body]);
  };
}

async function createSeedsAndInsert() {
  await db.query('TRUNCATE TABLE users CASCADE');
  await db.query('TRUNCATE TABLE messages');
  await fillUsers();
  await insertToDb();
  return;
}

createSeedsAndInsert();


