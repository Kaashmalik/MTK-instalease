/**
 * Artillery Load Test Processor
 * 
 * Custom functions for load testing scenarios.
 */

module.exports = {
  generateRandomString: generateRandomString,
  generateRandomNumber: generateRandomNumber,
};

/**
 * Generate a random string for testing
 */
function generateRandomString(context, events, done) {
  context.vars.randomString = Math.random().toString(36).substring(7);
  return done();
}

/**
 * Generate a random number within a range
 */
function generateRandomNumber(context, events, done) {
  const min = context.vars.min || 1000;
  const max = context.vars.max || 10000;
  context.vars.randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return done();
}

