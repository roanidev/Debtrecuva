/* ------------------------------------------------------------------------------------------------------------------ */
/*                                                CONFIGURE LIST OF DBS                                               */
/* ------------------------------------------------------------------------------------------------------------------ */
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-quick-search'));
var admindb = new PouchDB('model/databases/admin');
var agentsdb = new PouchDB('model/databases/agents');
var emailsdb = new PouchDB('model/databases/emailsdb');
var smsdb = new PouchDB('model/databases/smsdb');
var collectionsdb = new PouchDB('model/databases/collectionsdb');

module.exports = { admindb, agentsdb, emailsdb, smsdb, collectionsdb }