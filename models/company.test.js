"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const Company = require("./company.js");
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

/************************************** Creation */

describe("Creation", function () {
  const newCompany = {
    handle: "newCompany",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test("Should successfully create a new company", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
       FROM companies
       WHERE handle = 'newCompany'`
    );
    expect(result.rows).toEqual([
      {
        handle: "newCompany",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("Should return BadRequestError with duplicate data", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** Retrieval */

describe("Retrieval", function () {
  test("Should successfully retrieve all companies", async function () {
    let companies = await Company.findAll();
    expect(companies.length).toBeGreaterThan(0);
  });

  test("Should successfully retrieve companies by minimum employees", async function () {
    let companies = await Company.findAll({ minEmployees: 2 });
    expect(companies.length).toBeGreaterThan(0);
  });

  test("Should successfully retrieve companies by maximum employees", async function () {
    let companies = await Company.findAll({ maxEmployees: 2 });
    expect(companies.length).toBeGreaterThan(0);
  });

  test("Should successfully retrieve companies by both minimum and maximum employees", async function () {
    let companies = await Company.findAll({ minEmployees: 1, maxEmployees: 2 });
    expect(companies.length).toBeGreaterThan(0);
  });

  test("Should successfully retrieve companies by name", async function () {
    let companies = await Company.findAll({ name: "1" });
    expect(companies.length).toBeGreaterThan(0);
  });

  test("Should return an empty list if no matching companies found", async function () {
    let companies = await Company.findAll({ name: "nope" });
    expect(companies).toEqual([]);
  });

  test("Should return BadRequestError if minimum employees greater than maximum", async function () {
    try {
      await Company.findAll({ minEmployees: 10, maxEmployees: 1 });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** Retrieval by ID */

describe("Retrieval by ID", function () {
  test("Should successfully retrieve a company by handle", async function () {
    let company = await Company.get("c1");
    expect(company).toBeDefined();
  });

  test("Should return NotFoundError if no such company exists", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** Update */

describe("Update", function () {
  const updateData = {
    name: "NewName",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("Should successfully update a company", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
       FROM companies
       WHERE handle = 'c1'`
    );
    expect(result.rows).toEqual([
      {
        handle: "c1",
        name: "NewName",
        description: "New Description",
        num_employees: 10,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("Should successfully update a company with null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
       FROM companies
       WHERE handle = 'c1'`
    );
    expect(result.rows).toEqual([
      {
        handle: "c1",
        name: "New",
        description: "New Description",
        num_employees: null,
        logo_url: null,
      },
    ]);
  });

  test("Should return NotFoundError if no such company to update", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("Should return BadRequestError with no data for update", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** Removal */

describe("Removal", function () {
  test("Should successfully remove a company", async function () {
    await Company.remove("c1");
    const res = await db.query(
      "SELECT handle FROM companies WHERE handle='c1'"
    );
    expect(res.rows.length).toEqual(0);
  });

  test("Should return NotFoundError if no such company to remove", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
