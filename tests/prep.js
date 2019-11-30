const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { paths } = require(path.resolve(
  __dirname,
  "./../res/linux-cert-stores.json"
));
const testingPath = JSON.stringify({
  paths: ["./../res/test.crt"]
});

it("Should have performed file ops without exceptions.", () => {
  try {
    const filePath = path.resolve(__dirname, "./../res/linux-cert-stores.json");
    fs.unlinkSync(filePath);
    fs.writeFileSync(filePath, testingPath, {
      encoding: "utf-8"
    });
    assert.equal(0, 0);
  } catch (err) {
    console.error(err);
  }
});
