/**
 * Configs for the API
 *
 */

// container for environment;

const environments = {};

// common config
const commonConfigs = {
  maxChecks: 5,
  twilio: {
    fromPhone: "+14065211627",
    toPhone: "+256705465771",
    accountSid: "ACc9b75a554f0a3e516bccc54e69744bf1",
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
};

// for development
environments.development = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "development",
  hashingSecret: "thisIsASecret",
  ...commonConfigs,
};

// for production
environments.production = {
  httpPort: 8000,
  httpsPort: 8001,
  envName: "production",
  hashingSecret: "thisIsAlsoSecret",
  ...commonConfigs,
};

// check whether NODE_ENV is set as a command line arg
const currentEnvironment =
  typeof process.env.NODE_ENV === "string" ? process.env.NODE_ENV : "";

//check whether the currentEnvironment exists in environment object otherwise default to development.
const environmentToExport =
  typeof environments[currentEnvironment] === "object"
    ? environments[currentEnvironment]
    : environments.development;

module.exports = environmentToExport;
