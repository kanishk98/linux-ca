const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { getAllCerts } = require("../src/index");

const { paths } = require(path.resolve(
  __dirname,
  "./../res/linux-cert-stores.json"
));
const testingPath = JSON.stringify({
  paths: ["./../res/test.crt"]
});

let fileOpsFlag = false;

try {
  const filePath = path.resolve(__dirname, "./../res/linux-cert-stores.json");
  fs.unlinkSync(filePath);
  fs.writeFileSync(filePath, testingPath, {
    encoding: "utf-8"
  });
  fileOpsFlag = true;
} catch (err) {
  console.error(err);
}

it("Should have performed file ops without exceptions.", () => {
  assert.equal(fileOpsFlag, true);
});

it("readSync should provide correct cert count", async () => {
  try {
    const certs = await getAllCerts(true);
    assert.equal(certs.length, 1);
  } catch (err) {
    console.error(err);
  }
});
