const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { getAllCerts, getFilteredCerts, streamCerts } = require("../src/index");

const { paths } = require(path.resolve(
  __dirname,
  "./../res/linux-cert-stores.json"
));
const testingPath = JSON.stringify({
  paths: ["./../res/test.crt"]
});

it("readSync should provide correct cert count", async () => {
  const certs = await getAllCerts(true);
  assert.equal(certs.length, 1);
});

it("reading in async mode should provide correct cert count", async () => {
  const certs = await getAllCerts();
  assert.equal(certs.length, 1);
});

it("should filter out certificate", async () => {
  const certs = await getFilteredCerts("github");
  assert.equal(certs.length, 0);
});

it("should filter in certificate", async () => {
  const certs = await getFilteredCerts("abhigyank.zulipdev.org");
  assert.equal(certs.length, 1);
});

it("should stream correct cert count", done => {
  const onDataMethod = data => {
    const certs = data.split(/(?=-----BEGIN\sCERTIFICATE-----)/g);
    assert.equal(certs.length, 1);
    done();
  };
  streamCerts(onDataMethod);
});
