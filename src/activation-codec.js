import yaml from 'js-yaml';
import callbacks from 'when/callbacks';

const crypto2 = require('crypto2');

export const cryptoPromise = {
  readPrivateKey: callbacks.lift(crypto2.readPrivateKey),
  readPublicKey: callbacks.lift(crypto2.readPublicKey),
  sign: callbacks.lift(crypto2.sign),
  verify: callbacks.lift(crypto2.verify)
}

export const generateCode = (privateKeyPath, activationData) => {
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

export const verifyCode = (publicKeyPath, signedActivationCode) => {
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
}

export const extractCode = (publicKeyPath, signedActivationCode) => {
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
}
