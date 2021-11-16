const assert = require("assert");
const fs = require("fs");
const path = require("path");
const sinon = require('sinon');
const child_process = require("child_process");
const { getAllCerts, getFilteredCerts, streamCerts } = require("../src/index");

const { paths } = require(path.resolve(
  __dirname,
  "./../res/linux-cert-stores.json"
));
const testingPath = JSON.stringify({
  paths: ["./../res/test.crt"]
});

let execSync = undefined;
let exec = undefined;

beforeEach(() => {
  execSync = sinon.stub(child_process, "execSync");
  exec = sinon.stub(child_process, "exec");
});

afterEach(() => {
  execSync.restore();
  exec.restore();
});

it("readSync provides correct cert count", async () => {
  execSync.onFirstCall().returns("someURL");
  execSync.onSecondCall().returns(fs.readFileSync("res/test.crt"));

  const certs = await getAllCerts(true);

  assert.equal(certs.length, 1);
  assert.equal(execSync.getCall(0).args[0], 'p11tool --only-urls --batch --list-all-trusted pkcs11:model=p11-kit-trust;manufacturer=PKCS%2311%20Kit;serial=1;token=System%20Trust');
  assert.equal(execSync.getCall(1).args[0], 'p11tool --export "someURL"');
});

it("reading in async mode provides correct cert count", async () => {
  exec.yields(null, "someURL", "");
  execSync.returns(fs.readFileSync("res/test.crt"));

  const certs = await getAllCerts();

  assert.equal(certs.length, 1);
  assert.equal(exec.getCall(0).args[0], 'p11tool --only-urls --batch --list-all-trusted pkcs11:model=p11-kit-trust;manufacturer=PKCS%2311%20Kit;serial=1;token=System%20Trust');
  assert.equal(execSync.getCall(0).args[0], 'p11tool --export "someURL"');
});

it("readSync provides correct cert count, even if p11tool fails", async () => {
  execSync.onFirstCall().throws("noCertsError");

  const certs = await getAllCerts(true);
  assert.equal(certs.length, 1);
});

it("reading in async mode provides correct cert count, even if p11tool fails", async () => {
  exec.yields(new Error("failed"), null, null);

  const certs = await getAllCerts();
  assert.equal(certs.length, 1);
});

it("filters out certificate", async () => {
  exec.yields(new Error("failed"), null, null);

  const certs = await getFilteredCerts("github");
  assert.equal(certs.length, 0);
});

it("filters in certificate", async () => {
  exec.yields(null, "someURL", "");
  execSync.returns(fs.readFileSync("res/test.crt"));

  const certs = await getFilteredCerts("DigiCert");
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
