import yaml from 'js-yaml';
import callbacks from 'when/callbacks';
import moment from 'moment';

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

export { isAuthorized, generateCode, verifyCode, extractCode, register, recall };
