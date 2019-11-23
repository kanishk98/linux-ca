const fs = require("fs");

const { paths } = require("../res/linux-cert-stores.json");
const splitPattern = /(?=-----BEGIN\sCERTIFICATE-----)/g;

const getAllCerts = (onData, onError, readSync = false) => {
  // TODO: Include https module certs here too
  const certs = [];
  for (const path of paths) {
    try {
      const file = fs.readFileSync(path, "utf-8");
      certs.push(file.split(splitPattern).map(cert => cert));
      onData(certs);
      break;
    } catch (err) {
      onError(err);
    }
    // control reaches here only when all distro paths failed
    onError(
      new Error(
        "No certificates were found. If you think this is a bug, please report it at https://github.com/kanishk98/linux-ca/issues"
      )
    );
  }
};

const getCert = (domain, onError) => {};

const streamAllCerts = (onData, onError) => {};

module.exports = { getAllCerts };
