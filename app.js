/* ------------------------------------------------- Import dot env ------------------------------------------------- */
require('dotenv').config();
const fileUpload = require('express-fileupload');
PouchSession = require("session-pouchdb-store");
 
/* ------------------------------------------------ Start express app ----------------------------------------------- */
const express = require('express');
const Api = require('./routes/api');
const Web = require('./routes/web');
const session = require('express-session');

const app = express();
/* ----------------------------- session storage ---------------------------- */
var LokiStore = require('connect-loki')(session);
var options = { path: './databases/sessionstore.db' }; // See available options below

app.use(
  session({

    secret: process.env.ENCKEY,
    key: "production",
    proxy: "true",
    resave: false,
    saveUninitialized: false,
    store: new LokiStore(options),
  })
);
/* --------------------------------------------- SET DEFAULT MIDDLEWARE --------------------------------------------- */
/* ---------------------------------------------------- JSON POST --------------------------------------------------- */
app.use(express.json());
/* -------------------------------------------------- RECEIVE DATA -------------------------------------------------- */
app.use(express.urlencoded({ extended: false }))
/* ----------------------------------------------- RECEIVE AND UPLOAD LOCAL FILES ---------------------------------------------- */
app.use(fileUpload());


/* ---------------------------------- SET-UP STRUCTURE FOR ALSO HANDLING FRONT END ---------------------------------- */
/* ---------------------------------------------- static assets css etc --------------------------------------------- */
app.use(express.static("public"));
/* -------------------------------------- HANDLE FRONT END SYSTEM LIKE HTML etc ------------------------------------- */
app.set('view engine', 'ejs')




/* ---------------------------------------------- ADD CUSTOM MIDDLEWARE --------------------------------------------- */
Api(app);
Web(app);

/* ------------------------------------------------- RUN THE SERVER ------------------------------------------------- */
app.listen(process.env.PORT, () => {
    console.log(`app is running on ${process.env.PORT}`)
})




