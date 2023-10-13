const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", () => {
  it("returns setCols and values correctly", () => {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name" };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result.setCols).toBe('"first_name"=$1, "age"=$2');
    expect(result.values).toEqual(["Aliya", 32]);
  });

  it("throws BadRequestError if no data is provided", () => {
    const dataToUpdate = {};
    const jsToSql = { firstName: "first_name" };

    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow(
      BadRequestError
    );
  });
});
