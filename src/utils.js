const { pki } = require("node-forge");

const pemToCert = pem => pki.certificateFromPem(pem);

const certToPem = cert => pki.certificateToPem(cert);

const defaultEqualityMethod = (s1, s2) => {
  if (!s1 || !s2) {
    return false;
  }
  if (s1.includes(s2) || s2.includes(s1)) {
    return true;
  }
  return false;
};

module.exports = { pemToCert, certToPem, defaultEqualityMethod };
