
const Cryptr = require('cryptr');
let cryptr = new Cryptr(process.env.ENCKEY);

module.exports = { cryptr };