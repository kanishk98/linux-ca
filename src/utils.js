const { pki } = require("node-forge");

const pemToCert = pem => pki.certificateFromPem(pem);

const certToPem = cert => pki.certificateToPem(cert);

const defaultFilter = (cert, subject) => {
  // extract subject from cert and retain in array if there's a match
  if (!cert || !subject) {
    return false;
  }
  const certSubject = cert.subject.attributes
    .map(attribute => [attribute.shortName, attribute.value].join("="))
    .join(", ");
  if (certSubject.includes(subject) || subject.includes(certSubject)) {
    return true;
  }
  return false;
};

module.exports = { pemToCert, certToPem, defaultFilter };
