"use strict";

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db.js");
const Job = require("./job.js");
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

/************************************** create */

describe("Create Job", function () {
  test("Should successfully create a new job", async function () {
    let newJob = {
      companyHandle: "c1",
      title: "Test Job",
      salary: 100,
      equity: "0.1",
    };
    let job = await Job.create(newJob);
    expect(job).toMatchObject({
      ...newJob,
      id: expect.any(Number),
    });
  });
});

/************************************** findAll */

describe("Find All Jobs", function () {
  test("Should find all jobs when no filters are applied", async function () {
    let jobs = await Job.findAll();
    expect(jobs.length).toBeGreaterThan(0);
  });

  test("Should find jobs with a minimum salary of 250", async function () {
    let jobs = await Job.findAll({ minSalary: 250 });
    expect(jobs.length).toBeGreaterThan(0);
  });

  test("Should find jobs with equity available", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs.length).toBeGreaterThan(0);
  });

  test("Should find jobs with a minimum salary of 150 and equity available", async function () {
    let jobs = await Job.findAll({ minSalary: 150, hasEquity: true });
    expect(jobs.length).toBeGreaterThan(0);
  });

  test("Should find jobs with a specific title", async function () {
    let jobs = await Job.findAll({ title: "Job1" });
    expect(jobs.length).toBeGreaterThan(0);
  });
});

/************************************** get */

describe("Get Job", function () {
  test("Should retrieve a job successfully", async function () {
    let job = await Job.get(testJobIds[0]);
    expect(job).toBeDefined();
  });

  test("Should throw NotFoundError if no such job exists", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("Update Job", function () {
  test("Should successfully update a job", async function () {
    let updateData = {
      title: "New Title",
      salary: 500,
      equity: "0.5",
    };
    let job = await Job.update(testJobIds[0], updateData);
    expect(job).toMatchObject({
      id: testJobIds[0],
      companyHandle: "c1",
      ...updateData,
    });
  });

  test("Should throw NotFoundError if no such job exists", async function () {
    try {
      await Job.update(0, {
        title: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("Should throw BadRequestError with no data", async function () {
    try {
      await Job.update(testJobIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("Remove Job", function () {
  test("Should successfully remove a job", async function () {
    await Job.remove(testJobIds[0]);
    const res = await db.query("SELECT id FROM jobs WHERE id=$1", [
      testJobIds[0],
    ]);
    expect(res.rows.length).toEqual(0);
  });

  test("Should throw NotFoundError if no such job exists", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
