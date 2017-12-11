import yaml from 'js-yaml';

export const register = (registrationData) => {
  return yaml.safeDump(registrationData);
};

export const recall = (encodedRegistration) => {
  return yaml.safeLoad(encodedRegistration);
}
