const {randomUUID: uuidv4} = require('node:crypto');

module.exports = () => uuidv4().replace(/-/g, '');
