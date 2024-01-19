const sgMail = require('@sendgrid/mail');
const sendResponse = require('./resHandler');
const { emailSchema } = require('../schema/systemSchema');
const { emailsdb } = require('../model/database');


const sendSingle = async (data) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    let error = true;
    let message = "";
    const msg = {
        to: data.to.trim(),
        from: data.from, // Use the email address or domain you verified above
        subject: data.subject,
        html: data.message,
    };

    await sgMail
        .send(msg)
        .then(() => {
            console.log("hello")
        
            let emails = emailSchema(data)
            emailsdb.put(emails).then(function (response) { }).catch(err => { console.log(err) });
            error = false;
            message = "Message sent successfully"
        })
        .catch((error) => {
            console.log(error)
            error = true;
            message = "Could not send email"

        })
    return sendResponse(error, message);

}

const sendBulk = async (data) => {


    let emails = data.recipients;
    let successful = 0;
    let failed = 0;
    let failedarray = [];
    await Promise.all(emails.map(async item => {

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: item.email.trim(),
            from: data.from, // Use the email address or domain you verified above
            subject: data.subject,
            html: data.message,
        };

        sgMail
            .send(msg)
            .then(() => {
                successful++;
            })
            .catch((error) => {
                console.log(error)
                failed++;
                failedarray.push(item.email);
            })


    }))
    let emailslist = emailSchema(data)
    emailsdb.put(emailslist).then(function (response) { }).catch(err => { });
    return sendResponse(false, "Bulk Email Send Attempt completed", { nooffailedemails: failed, noofsuccessfulemails: successful, emailsnotsent: failedarray })

}



module.exports = { sendSingle, sendBulk }