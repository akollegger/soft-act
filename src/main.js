export {generateCode, verifyCode, extractCode} from './activation-codec.js';
export {register, recall} from './user-registration.js';

import moment from 'moment';

export function isAuthorized(userInfo, activationCode, feature) {

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
