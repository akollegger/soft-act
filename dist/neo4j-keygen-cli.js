'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var vorpal = _interopDefault(require('vorpal'));
var chalk = _interopDefault(require('chalk'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var semver = _interopDefault(require('semver'));
var stringifyObject = _interopDefault(require('stringify-object'));
var most = _interopDefault(require('most'));
var moment = _interopDefault(require('moment'));
var callbacks = _interopDefault(require('when/callbacks'));
var yaml = _interopDefault(require('js-yaml'));

const crypto2 = require('crypto2');

const cryptoPromise = {
  readPrivateKey: callbacks.lift(crypto2.readPrivateKey),
  readPublicKey: callbacks.lift(crypto2.readPublicKey),
  sign: callbacks.lift(crypto2.sign),
  verify: callbacks.lift(crypto2.verify)
};

const generateCode = (privateKeyPath, activationData) => {
  const license = yaml.safeDump(activationData);
  return cryptoPromise.readPrivateKey(privateKeyPath)
    .then( ([err, privateKey]) => {
      return cryptoPromise.sign(license, privateKey)
        .then( ([err, signature]) => {
          activationData.signature = signature;
          return(
    				'########################################\n' +
            '# NEO4J SOFTWARE FEATURE ACTIVATION CODE\n' +
    				yaml.safeDump(activationData));
    });
  });
};

const verifyCode = (publicKeyPath, signedActivationCode) => {
  return cryptoPromise.readPublicKey(publicKeyPath)
    .then( ([err, publicKey]) => {
      const fullactivationData = yaml.safeLoad(signedActivationCode);
      const signature = fullactivationData.signature;
      delete fullactivationData.signature;
      const partialLicense = yaml.safeDump(fullactivationData);
      return cryptoPromise.verify(partialLicense, publicKey, signature)
        .then( ([err, isValid]) => {
          return isValid;
        })
  });
};

const extractCode = (publicKeyPath, signedActivationCode) => {
  return cryptoPromise.readPublicKey(publicKeyPath)
    .then( ([err, publicKey])  => {
      const fullactivationData = yaml.safeLoad(signedActivationCode);
      const signature = fullactivationData.signature;
      delete fullactivationData.signature;
      const partialLicense = yaml.safeDump(fullactivationData);
      return cryptoPromise.verify(partialLicense, publicKey, signature)
        .then( ([err, isValid]) => {
          if (isValid) {
            return fullactivationData;
          } else {
            throw new Error('invalid activation code');
          }
        })
  });
};

const register = (registrationData) => {
  return yaml.safeDump(registrationData);
};

const recall = (encodedRegistration) => {
  return yaml.safeLoad(encodedRegistration);
};

function isAuthorized(userInfo, activationCode, feature) {

  // check that the key hasn't expired
  const rightNow = moment();
  var expirationDate = moment(activationCode.expirationDate);

  console.log('dates', rightNow.format(), expirationDate.format());
  if (rightNow.isAfter(expirationDate)) {
    return false;
  }

  console.log('registrants', activationCode.registrant, userInfo.registrant);
  if ( ! new RegExp(activationCode.registrant, 'g').test(userInfo.registrant) ) {
    return false;
  }

  console.log('features', activationCode.featureName, feature);
  if ( ! new RegExp(activationCode.featureName, 'g').test(feature) ) {
    return false;
  }

  return true;
}

const vorpalCLI = vorpal();

var privateKeyPath = 'keys/private_key.pem';
var publicKeyPath = 'keys/public_key.pem';

var activationCodeDirectory = 'codes';
var registrationDirectory = 'users';

const activationCodeFileFor = (codename) => {
  return path.join(activationCodeDirectory, codename + '.neo4jcode')
};

const registrationFileFor = (username) => {
  return path.join(registrationDirectory, username + '.user')
};

vorpalCLI.delimiter(chalk.green('[') + chalk.red('&~') + chalk.green(']')).history('neo4j-keygen');

vorpalCLI.command('keys', 'Show the current public/private keys being used').action(function(args, callback) {
  var self = this;
  self.log('Private: ', privateKeyPath);
  self.log('Public: ', publicKeyPath);
  callback();
});

vorpalCLI.command('keys public [path]', 'Set or get the public key used to verify signed messages.').action(function(args, callback) {
  var self = this;
  if (args.path) {
    publicKeyPath = args.path;
  }
  self.log('Public: ', publicKeyPath);
  callback();
});

vorpalCLI.command('keys private [path]', 'Set or get private key used to sign messages.').action(function(args, callback) {
  var self = this;
  if (args.path) {
    privateKeyPath = args.path;
  }
  self.log('Private: ', privateKeyPath);
  callback();
});

vorpalCLI.command('generate <codename>', 'Create a software activation code.').option('-f, --feature [name regex]', 'Feature name to activate.').option('-v, --version [semver range]', 'Feature version range to activate.').option('-u, --registrant [name regex]', 'Full name of registrant.').option('-o, --org [name regex]', 'Organization of registrant.').option('-e, --email [address regex]', 'Email address of registrant.').option('-d, --date [ISO 8601]', 'Expiration date, in ISO 8601 format').action(function(args, callback) {
  let self = this;

  var rightNow = new Date();
  var nextYear = moment().add(1, 'years');

  var activationData = {
    activationVersion: '1.0.0',
    featureName: (args.options.feature || '/.*/'),
    featureVersion: (args.options.version || '*'),
    registrant: (args.options.registrant || '/.*/'),
    organization: (args.options.org || '/.*/'),
    email: (args.options.email || '/.+@.+/'),
    expirationDate: (args.options.date || nextYear.format())
  };

  generateCode(privateKeyPath, activationData)
    .then( (signedActivation) => {
      const activationCodeFilename = activationCodeFileFor(args.codename);
      self.log('generated', signedActivation);
      fs.writeFile(activationCodeFilename, signedActivation, (err) => {
        if (err) {
          self.log(err);
        }
        self.log("Generated \"" + activationCodeFilename + "\"");
      });
  });

  callback();
});

vorpalCLI.command('register <username>', 'Mock a registered user.')
.option('-u, --registrant <full name>', 'Full name of registrant.')
.option('-o, --org <name>', 'Organization of registrant.')
.option('-e, --email <address>', 'Email address of registrant.')
.action(function(args, callback) {
  let self = this;

  const registrantData = {
    registrant: args.options.registrant,
    organization: args.options.org,
    email: args.options.email
  };

  const encodedRegistration = register(registrantData);

  const registrationFilename = registrationFileFor(args.username);
  fs.writeFile(registrationFilename, encodedRegistration, (err) => {
    if (err) {
      self.log(err);
    }
    self.log("Generated \"" + registrationFilename + "\"");
  });

  callback();
});

vorpalCLI.command('verify <codename>', 'Verify a signed feature activation.').action(function(args, callback) {
  var self = this;
  var activationCodeFilename = activationCodeFileFor(args.codename);
  const signedActivationCode = fs.readFileSync(activationCodeFilename, 'utf8');
  verifyCode(publicKeyPath, signedActivationCode)
    .then( (isValid) => {
      self.log(
        isValid
        ? `${activationCodeFilename} is a ${chalk.green("Valid Activation Code")}`
        : `${activationCodeFilename} is ${chalk.red("Not A Valid Activation Code")}`);
    });

  callback();
});

vorpalCLI.command('can <username> <feature>', 'According to available activation codes, can this registrant use this feature.')
.action(function(args, callback) {
  let self = this;

  const registrationFilename = registrationFileFor(args.username);
  const encodedRegistration = fs.readFileSync(registrationFilename, 'utf8');
  const userInfo = recall(encodedRegistration);

  fs.readdir(activationCodeDirectory, function(err, items) {

    most.from(items)
      .map( (item) => {
          var activationCodeFilename = path.join(activationCodeDirectory, item);

          return callbacks.call(fs.readFile, activationCodeFilename, 'utf8')
            .then( ([err, plainActivationCode]) => {
              if (err) throw Error(err);
               return extractCode(publicKeyPath, plainActivationCode)
                .then( (extractedActivationCode) => {
                    return isAuthorized(userInfo, extractedActivationCode, args.feature);
                })
                .catch( (e) => {} );
            })
            .catch( (e) => {} );
        }
      ).awaitPromises()
      .reduce( (result, maybeCan) => (result || maybeCan) , false)
      .then( (can) => {
            self.log(
              can
              ? `${userInfo.registrant} ${chalk.green("can")} ${args.feature} `
              : `${userInfo.registrant} ${chalk.red("can not")} ${args.feature} `
            );
      })
      .catch((e) => self.log('oops'));
  });

  callback();

});

vorpalCLI.command('showcode <codename>', 'Show the content of a feature activation code.').action(function(args, callback) {
  var self = this;
  var activationCodeFilename = activationCodeFileFor(args.codename);
  const fileContent = fs.readFileSync(activationCodeFilename, 'utf8');
  self.log(fileContent);

  callback();
});

vorpalCLI.command('showuser <username>', 'Show the user registration.').action(function(args, callback) {
  var self = this;
  const registrationFilename = registrationFileFor(args.username);

  const fileContent = fs.readFileSync(registrationFilename, 'utf8');
  self.log(fileContent);

  callback();
});
vorpalCLI.show();
