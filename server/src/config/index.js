/**
 * Configuration Index
 * Exports all configuration modules
 */

const database = require('./database');
const constants = require('./constants');
const telegram = require('./telegram');

module.exports = {
  ...database,
  ...constants,
  telegram,
};
