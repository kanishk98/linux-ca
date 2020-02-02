# linux-ca

[![npm version](https://badge.fury.io/js/linux-ca.svg)](https://badge.fury.io/js/linux-ca)

Easily get system root certificates on Linux machines.

## Installation

```sh
npm install --save linux-ca
```

If you've tried to install an SSL certificate on your machine and were puzzled when your Node.js app didn't pick up on that when making an HTTPS request, this is why:

> Node uses a
> [statically compiled, manually updated, hardcoded list](https://github.com/nodejs/node/blob/master/src/node_root_certs.h)
> of certificate authorities,
> rather than relying on the system's trust store...
> [Read more](https://github.com/nodejs/node/issues/4175)

`linux-ca` attempts to solve this problem for Linux system admins. If you have a Mac or Windows computer, you may be interested in [win-ca](https://github.com/ukoloff/win-ca) or [mac-ca](https://github.com/jfromaniello/mac-ca) instead. 

## Example use case

I wrote this module after receiving a feature request from a user of [Zulip Desktop](https://github.com/zulip/zulip-desktop). They wanted to be able to install their server's self-signed certificate on all their organisation's systems and have Zulip (which is an Electron app) recognise that when connecting to their chat server. However, because of the aforementioned problem, this wasn't happening. 
With this module, you should be able to read certificates from your system cert store and manipulate them as you wish for your application.

## Documentation

If you'd like to read all your certs at once, just run 

```js
const { getAllCerts } = require("linux-ca");

// getAllCerts() returns a Promise. To know more about Promises, check out 
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise

// readSync is optional and false by default
// if you set it to true, the certs will be read synchronously
getAllCerts(readSync).then(certs => {
  console.log(certs);
}).catch(err => {
  console.error(err);
});
```

> Take care to handle promise rejections too!

If you prefer to filter out some certificates instead, you need to provide a filter method. 
The example below shows the default filter method and you can simply swap it in with yours:

```js
const { getFilteredCerts } = require("linux-ca");

// example of a filtering method that returns true if cert should be included in filtered list
// it returns false otherwise
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

// subject here is just a value that you can use for matching
// I figured it might make using the module easier for a few users, but feel free to pass along null
// it's only used in the filterMethod method, so you can customise that as you like

// defaultFilter is optional and set to the above method by default
// readSync is optional and false by default
// if you set it to true, the certs will be read synchronously
getFilteredCerts("google.com", defaultFilter, readSync).then(filteredCerts => {
	console.log(filteredCerts);
}).catch(err => {
	console.error(err);
});
```

I don't think that it's particularly useful, but I added the capability to stream certificates one at a time as well. 
If you have a very large number of certs, then this should help reduce your application's memory usage. 

```js
const { streamCerts } = require("linux-ca");

const onDataMethod = data => {
	// you'll probably want to do something cooler here
	// data represents one certificate
	console.log(data);
}

// filterMethod and readSync are optional arguments 
// readSync is optional and false by default
// if you set it to true, the certs will be read synchronously
streamCerts(onDataMethod, filterMethod, readSync);
```

## Credits

[win-ca](https://github.com/ukoloff/win-ca) and [mac-ca](https://github.com/jfromaniello/mac-ca) are great packages which helped me a lot with this one. It's my first attempt at writing an `npm` package, and I'd also like to thank [Akash Nimare](https://github.com/akashnimare) (my Zulip mentor) for giving me the chance to work on this problem. :)
