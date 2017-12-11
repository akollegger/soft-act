# soft-act

A proof-of-concept for generating and using software activation codes.


Activation codes have fields that are treated as RegEx expressions, so that a code can be crafted
which approves a broad range of users or features.

For example, given a software activation code like:

```
########################################
# NEO4J SOFTWARE FEATURE ACTIVATION CODE
activationVersion: 1.0.0
featureName: neo4j-desktop
featureVersion: /1\.*/
registrant: Andreas Kollegger
organization: /.*/
email: andreas@neo4j.com
expirationDate: '2018-12-07T15:28:27.901Z'
signature: >-
  94b803ff9e7102423866c24dc21b48a59ae214ed46428ed83751fe54c7bf3275293c32cf8bb182146d99b3f51051f13a24318ae4dec050bc9a4549607e28bbb989a0d6ad07157ff62011234a2ba7851e41d7edb983cedf138600c4ad9d207b43448359b3f8f9dd4a37bd753dbc848eead586fd2a4dca2dba06735bd79bd29cdaa81946e6b011f2247e3f7c0f605a8ac4adde98c78e86254e6fa64134846a1170bc8bbb180f1c0a3e1cf62c4d05c154bca1f166fd2b1980aa36d5bf32ec02e56cd2cd4eeb90e0d4561c5bad4d04347fe357421e4b4aa13135ea6b1298a69bf6c2b9fa21d108f377cda7064e0eaeb4a33e7268ac9c556b7070c05871071e97dfbf
```

And given a user like:
```
registrant: Andreas Kollegger
organization: Neo4j
email: andreas@neo4j.com
```

To check whether the user is allowed to use a particular `feature`, these checks occur:

1. `code.isValid()`
2. `code.expirationData > now()`
3. `/code.registrant/.test(user.registration)`
4. `/code.email/.test(user.email)`
5. `/code.organization/.test(user.organization)`
6. `/code.feature/.test(feature)`

## Forked readme...

This repo contains a bare-bones example of how to create a library using Rollup, including importing a module from `node_modules` and converting it from CommonJS.

We're creating a library called `how-long-till-lunch`, which usefully tells us how long we have to wait until lunch, using the [ms](https://github.com/zeit/ms) package:

```js
console.log('it will be lunchtime in ' + howLongTillLunch());
```

## Getting started

Clone this repository and install its dependencies:

```bash
git clone https://github.com/rollup/rollup-starter-lib
cd rollup-starter-lib
npm install
```

`npm run build` builds the library to `dist`, generating three files:

* `dist/how-long-till-lunch.cjs.js`
    A CommonJS bundle, suitable for use in Node.js, that `require`s the external dependency. This corresponds to the `"main"` field in package.json
* `dist/how-long-till-lunch.esm.js`
    an ES module bundle, suitable for use in other people's libraries and applications, that `import`s the external dependency. This corresponds to the `"module"` field in package.json
* `dist/how-long-till-lunch.umd.js`
    a UMD build, suitable for use in any environment (including the browser, as a `<script>` tag), that includes the external dependency. This corresponds to the `"browser"` field in package.json

`npm run dev` builds the library, then keeps rebuilding it whenever the source files change using [rollup-watch](https://github.com/rollup/rollup-watch).

`npm test` builds the library, then tests it.

*Note that you would often include the `dist` folder in your [.gitignore](https://github.com/rollup/rollup-starter-lib/blob/master/.gitignore) file, but they are included here for ease of illustration.*


## Variations

* [babel](https://github.com/rollup/rollup-starter-lib/tree/babel) — illustrates writing the source code in ES2015 and transpiling it for older environments with [Babel](https://babeljs.io/)
* [buble](https://github.com/rollup/rollup-starter-lib/tree/buble) — similar, but using [Bublé](https://buble.surge.sh/) which is a faster alternative with less configuration



## License

[MIT](LICENSE).
