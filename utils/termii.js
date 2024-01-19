var request = require('request');
const sendResponse = require('./resHandler');
const { smsdb } = require('../model/database');
const { smsSchema } = require('../schema/systemSchema');

const sendSms = async (data, res) => {
    var error = true;
    var message = "";

    var ndata = {
        "to": "234" + data.to.substring(1),
        "from": "DEBTRECUVA",
        "sms": data.message,
        "type": "plain",
        "api_key": process.env.TERMIIAPIKEY,
        "channel": "generic",

    };
    var options = {
        'method': 'POST',
        'url': 'https://api.ng.termii.com/api/sms/send',

        'headers': {
            'Content-Type': ['application/json', 'application/json']
        },
        body: JSON.stringify(ndata)

    };

    request(options, function (err, response) {

        if (err) {
            error = true;
            message = "Could not send sms"
            res.status(200).json(sendResponse(error, message));
        } else {

            error = false;

            let newsms = smsSchema(data);
            console.log(response.body)
            message = JSON.parse(response.body);
            smsdb.put(newsms).then(function (response) { }).catch(err => { console.log(err) });
            res.status(200).json(sendResponse(error, message.message));

        }

    })






}


const sendSmsBulk = (to, sms) => {
    to.map(item => {
        var data = {
            "to": to.mobile,
            "from": "DEBTRECUVA",
            "sms": sms,
            "type": "plain",
            "api_key": process.env.TERMIIAPIKEY,
            "channel": "dnd",

        };
        var options = {
            'method': 'POST',
            'url': 'https://api.ng.termii.com/api/sms/send',
            'headers': {
                'Content-Type': ['application/json', 'application/json']
            },
            body: JSON.stringify(data)

        };
        request(options, function (error, response) {
            console.log(error);
            console.log(response);

        });
    })


}


module.exports = { sendSms, sendSmsBulk }