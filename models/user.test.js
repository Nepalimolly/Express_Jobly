"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** Authentication */

describe("Authentication", function () {
  test("Should authenticate a user with correct credentials", async function () {
    const user = await User.authenticate("u1", "password1");
    expect(user).toMatchObject({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
  });

  test("Should return UnauthorizedError if no such user", async function () {
    try {
      await User.authenticate("nope", "password");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("Should return UnauthorizedError if wrong password", async function () {
    try {
      await User.authenticate("c1", "wrong");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

/************************************** Registration */

describe("Registration", function () {
  const newUser = {
    username: "newUser",
    firstName: "Test",
    lastName: "Tester",
    email: "test@test.com",
    isAdmin: false,
  };

  test("Should successfully register a new user", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
    });
    expect(user).toEqual(newUser);
    const found = await db.query(
      "SELECT * FROM users WHERE username = 'newUser'"
    );
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(false);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("Should successfully register a new admin user", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
      isAdmin: true,
    });
    expect(user).toEqual({ ...newUser, isAdmin: true });
    const found = await db.query(
      "SELECT * FROM users WHERE username = 'newUser'"
    );
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(true);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("Should return BadRequestError with duplicate data", async function () {
    try {
      await User.register({
        ...newUser,
        password: "password",
      });
      await User.register({
        ...newUser,
        password: "password",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** User Management */

describe("User Management", function () {
  test("Should successfully retrieve all users", async function () {
    const users = await User.findAll();
    expect(users.length).toBeGreaterThan(0);
  });

  test("Should successfully retrieve a user by username", async function () {
    let user = await User.get("u1");
    expect(user).toBeDefined();
  });

  test("Should return NotFoundError if no such user exists", async function () {
    try {
      await User.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("Should successfully update a user's information", async function () {
    const updateData = {
      firstName: "NewF",
      lastName: "NewL",
      email: "new@example.com",
      isAdmin: true,
    };
    let updatedUser = await User.update("u1", updateData);
    expect(updatedUser).toEqual({
      username: "u1",
      ...updateData,
    });
  });

  test("Should successfully update a user's password", async function () {
    let updatedUser = await User.update("u1", {
      password: "newPassword",
    });
    expect(updatedUser).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
    const found = await db.query("SELECT * FROM users WHERE username = 'u1'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("Should return NotFoundError if no such user to update", async function () {
    try {
      await User.update("nope", {
        firstName: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("Should return BadRequestError if no data provided for update", async function () {
    expect.assertions(1);
    try {
      await User.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("Should successfully remove a user", async function () {
    await User.remove("u1");
    const res = await db.query("SELECT * FROM users WHERE username='u1'");
    expect(res.rows.length).toEqual(0);
  });

  test("Should return NotFoundError if no such user to remove", async function () {
    try {
      await User.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("Should successfully apply for a job", async function () {
    await User.applyToJob("u1", testJobIds[1]);

    const res = await db.query("SELECT * FROM applications WHERE job_id=$1", [
      testJobIds[1],
    ]);
    expect(res.rows).toEqual([
      {
        job_id: testJobIds[1],
        username: "u1",
      },
    ]);
  });

  test("Should return NotFoundError if no such job", async function () {
    try {
      await User.applyToJob("u1", 0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("Should return NotFoundError if no such user to apply", async function () {
    try {
      await User.applyToJob("nope", testJobIds[0]);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
