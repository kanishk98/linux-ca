const es = require("event-stream");
const fs = require("fs");
const https = require("https");
const { certToPem, pemToCert, defaultFilter } = require("./utils");

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
      reject(noCertsError);
    } else {
      let rejectedPaths = 0;
      for (const path of paths) {
        fs.readFile(path, "utf-8", (err, file) => {
          if (err) {
            if (err.code !== "ENOENT") {
              reject(err);
            }
            if (rejectedPaths === paths.length) {
              reject(noCertsError);
            }
            ++rejectedPaths;
          } else {
            certs.push(file.split(splitPattern).map(cert => cert));
            resolve(certs);
          }
        });
      }
    }
  });
};

const filterCerts = (data, filterAttribute, filterMethod = defaultFilter) => {
  return new Promise((resolve, reject) => {
    try {
      const certs = data.map(pem => pemToCert(pem));
      resolve(certs.filter(cert => filterMethod(cert, filterAttribute)));
    } catch (err) {
      reject(err);
    }
  });
};

const getFilteredCerts = (subject, readSync = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      const certs = await getAllCerts(readSync);
      resolve(await filterCerts(certs, subject));
    } catch (err) {
      reject(err);
    }
  });
};

const streamAllCerts = filterMethod => {
  let breakFlag = false;
  for (const path of paths) {
    if (breakFlag) {
      break;
    }
    const stream = fs.createReadStream(path, { encoding: "utf-8" });
    stream.on("error", err => {
      if (err.code !== "ENOENT") {
        console.error(err);
      }
    });
    stream
      .pipe(es.split(splitPattern))
      .pipe(
        es.map((data, callback) => {
          if (filterMethod) {
            if (!filterMethod(data)) {
              // filter not passed, drop this data
              callback();
            }
          }
          // if callback is not called, then map thinks the stream is still being processed
          callback(null, data);
        })
      )
      .on("error", err => {
        console.error(err);
      })
      .on("end", () => {
        console.log("Finished reading the entire file.");
        breakFlag = true;
      });
  }
};

module.exports = { getAllCerts, getFilteredCerts, streamAllCerts };
