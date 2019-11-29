const es = require("event-stream");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { certToPem, pemToCert, defaultFilter } = require("./utils");

const { paths } = require("../res/linux-cert-stores.json");
const splitPattern = /(?=-----BEGIN\sCERTIFICATE-----)/g;
const noCertsError = new Error(
  "No certificates were found. If you think this is a bug, please report it at https://github.com/kanishk98/linux-ca/issues"
);

const getAllCerts = (readSync = false) => {
  return new Promise((resolve, reject) => {
    const certs = [];
    if (readSync) {
      for (let certPath of paths)
        try {
          certPath = path.resolve(__dirname, certPath);
          const file = fs.readFileSync(certPath, "utf-8");
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
      for (let certPath of paths) {
        certPath = path.resolve(__dirname, certPath);
        fs.readFile(certPath, "utf-8", (err, file) => {
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

const filterCerts = (data, filterAttribute, filterMethod) => {
  return new Promise((resolve, reject) => {
    try {
      const certs = data.map(pem => pemToCert(pem));
      resolve(certs.filter(cert => filterMethod(cert, filterAttribute)));
    } catch (err) {
      reject(err);
    }
  });
};

const getFilteredCerts = (
  filterAttribute,
  filterMethod = defaultFilter,
  readSync = false
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const certs = await getAllCerts(readSync);
      resolve(await filterCerts(certs, filterAttribute, filterMethod));
    } catch (err) {
      reject(err);
    }
  });
};

const streamCerts = (onDataMethod, filterMethod, readSync = false) => {
  let breakFlag = false;
  for (let certPath of paths) {
    if (breakFlag) {
      break;
    }
    certPath = path.resolve(__dirname, certPath);
    const stream = fs.createReadStream(path, { encoding: "utf-8" });
    stream.on("error", err => {
      if (err.code !== "ENOENT") {
        console.error(err);
      }
    });
    const mappingFunction = readSync ? es.mapSync : es.map;
    stream
      .pipe(es.split(splitPattern))
      .pipe(
        mappingFunction((data, callback) => {
          if (filterMethod) {
            if (!filterMethod(data)) {
              // filter not passed, drop this data
              callback();
            }
          }
          onDataMethod(data);

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

module.exports = { getAllCerts, getFilteredCerts, streamCerts };
