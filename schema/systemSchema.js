const { v4: uuidv4 } = require('uuid');
const dayjs = require("dayjs");
const { cryptr } = require('../utils/encrypt');

/* ------------------------------------------------------------------------------------------------------------------ */
/*                                                    ADMIN SCHEMA                                                    */
/* ------------------------------------------------------------------------------------------------------------------ */
const adminSchema = (data) => {
    return {
        _id: (data._id) ? data._id : uuidv4(),
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        password: cryptr.encrypt(data.password),
        mobile: data.mobile,
        gender: data.gender,
        avatar: data.avatar,
        role: data.role,
        createdAt: (data.createdAt) ? data.createdAt : dayjs(),
        updatedAt: dayjs()
    }
}

/* ------------------------------------------------------------------------------------------------------------------ */
/*                                                    ADMIN SCHEMA                                                    */
/* ------------------------------------------------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------------------------------------------------ */
/*                                                    AGENTS SCHEMA                                                   */
/* ------------------------------------------------------------------------------------------------------------------ */
const agentsSchema = (data) => {
    return {
        _id: (data._id) ? data._id : uuidv4(),
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email.trim(),
        password: cryptr.encrypt(data.password.trim()),
        mobile: data.mobile,
        gender: data.gender,
        avatar: data.avatar,
        role: data.role,
        bio: data.bio,
        companiesassigned: [],
        createdAt: (data.createdAt) ? data.createdAt : dayjs(),
        updatedAt: dayjs()
    }
}

/* ------------------------------------------------------------------------------------------------------------------ */
/*                                                    AGENTS SCHEMA                                                   */
/* ------------------------------------------------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------------------------------------------------ */
/*                                              COLLECTION ACCOUNT SCHEMA                                             */
/* ------------------------------------------------------------------------------------------------------------------ */
const collectionsSchema = (data) => {
    return {
        _id: (data._id) ? data._id : uuidv4(),
        companyname: data.companyname,
        companyemail: data.companyemail,
        companylogo: data.companylogo,
        companypassword: data.companypassword,
        companymobile: data.companymobile,
        companybio: data.companybio,
        portfolio: (data.portfolio) ? data.portfolio : [],
        collectionsemail: (data.collectionsemail) ? data.collectionsemail : "",
        agentsassigned: (data.agentsassigned) ? data.agentassigned : [],
        createdAt: (data.createdAt) ? data.createdAt : dayjs(),
        updatedAt: dayjs()
    }
}

/* ------------------------------------------------------------------------------------------------------------------ */
/*                                              COLLECTION ACCOUNT SCHEMA                                             */
/* ------------------------------------------------------------------------------------------------------------------ */


/* ------------------------------------------------------------------------------------------------------------------ */
/*                                                    EMAIL SCHEMA                                                    */
/* ------------------------------------------------------------------------------------------------------------------ */
const emailSchema = (data) => {
    return {
        _id: (data._id) ? data._id : uuidv4(),
        sender: data.sender,
        subject: data.subject,
        from:data.from,
        recipients: data.recipients,
        message: data.message,
        agent: data.agent,
        collectionaccount: data.collectionaccount,
        createdAt: (data.createdAt) ? data.createdAt : dayjs(),
        updatedAt: dayjs()
    }
}


/* ------------------------------------------------------------------------------------------------------------------ */
/*                                                    EMAIL SCHEMA                                                    */
/* ------------------------------------------------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------------------------------------------------ */
/*                                                     SMS SCHEMA                                                     */
/* ------------------------------------------------------------------------------------------------------------------ */
const smsSchema = (data) => {
    return {
        _id: (data._id) ? data._id : uuidv4(),  
        to: data.to,
        sms: data.sms,
        agent: data.agent,
        collectionaccount: data.collectionaccount,
        createdAt: dayjs(),
        updatedAt: dayjs()
    }
}
/* ------------------------------------------------------------------------------------------------------------------ */
/*                                                     SMS SCHEMA                                                     */
/* ------------------------------------------------------------------------------------------------------------------ */

/* ----------------------------------------------------------------------------------------------------------------- */
/*                                                    ACTIVITY SCHEMA                                                */
/* ----------------------------------------------------------------------------------------------------------------- */
const activitySchema = (data) => {
    return {
        _id: (data._id) ? data._id : uuidv4(),
        adminid: data.adminid,
        sectionaccessed: data.sectionaccessed,
        pageroute:data.pageroute,
        action:data.action,
        createdAt: dayjs(),
        updatedAt: dayjs()
    }
}
/* ----------------------------------------------------------------------------------------------------------------- */
/*                                                    ACTIVITY SCHEMA                                                */
/* ----------------------------------------------------------------------------------------------------------------- */


module.exports = { adminSchema, agentsSchema, collectionsSchema, emailSchema, smsSchema, activitySchema };