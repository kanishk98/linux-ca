const fs = require("fs");
const https = require("https");
const { certToPem, pemToCert, defaultEqualityMethod } = require("./utils");

const { paths } = require("../res/linux-cert-stores.json");
const splitPattern = /(?=-----BEGIN\sCERTIFICATE-----)/g;
const noCertsError = new Error(
  "No certificates were found. If you think this is a bug, please report it at https://github.com/kanishk98/linux-ca/issues"
);

const getAllCerts = (readSync = false) => {
  return new Promise((resolve, reject) => {
    const certs = (https.globalAgent.options.ca =
      https.globalAgent.options.ca || []);
    if (readSync) {
      for (const path of paths)
        try {
          const file = fs.readFileSync(path, "utf-8");
          certs.push(file.split(splitPattern).map(cert => cert));
          resolve(certs);
        } catch (err) {
          if (err.code !== "ENOENT") {
            reject(err);
          }
        }
    } else {
      for (const path of paths) {
        fs.readFile(path, "utf-8", (err, file) => {
          if (err) {
            if (err.code !== "ENOENT") {
              reject(err);
            }
          } else {
            certs.push(file.split(splitPattern).map(cert => cert));
            resolve(certs);
          }
        });
      }
    }
    reject(noCertsError);
  });
};

const onDataPromise = (data, subject) => {
  return new Promise((resolve, reject) => {
    try {
      let certs = data.map(pem => pemToCert(pem));
      const filteredCerts = [];
      for (const cert of certs) {
        const certSubject = cert.subject.attributes
          .map(attribute => [attribute.shortName, attribute.value].join("="))
          .join(", ");
        if (defaultEqualityMethod(certSubject, subject)) {
          filteredCerts.push(certToPem(cert));
        }
      }
      resolve(filteredCerts);
    } catch (err) {
      reject(err);
    }
  });
};

const getCertsBySubject = (
  subject,
  readSync = false,
  equalityMethod = defaultEqualityMethod
) => {
  return new Promise((resolve, reject) => {
    getAllCerts(
      async data => {
        try {
          const filteredCerts = await onDataPromise(data, subject);
          resolve(filteredCerts);
        } catch (err) {
          reject(err);
        }
      },
      err => {
        console.error(err);
      },
      readSync
    );
  });
};

const streamAllCerts = (onData, onError) => {};

module.exports = { getAllCerts, getCertsBySubject };
