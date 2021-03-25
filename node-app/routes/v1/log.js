const express = require("express");
const router = express.Router();
const authorizedUserOnly = require('../../security/authorizedUserOnly')
const authorizedAdminOnly = require('../../security/authorizedAdminOnly')
const Log = require('../../models/log');

// naive checking of a date string
function is_date(str) {
    return (str.length === "2021-03-10T05:00:00.000Z".length);
}

router.post("/", authorizedUserOnly, authorizedAdminOnly, (req, res, next) => {

    //////////////////////////////
    // input parameters
    // 
    // user_token --> authorizedUserOnly converts user_token to req.user object 
    const user = req.user; // from user_token 
    let { skip, limit, filter } = req.body;

    console.log('filter', filter)

    if (skip === null || skip === undefined || skip < 0) {
        console.log('skip is not given. setting it to zero.')
        skip = 0;
    }

    if (limit === null || limit === undefined || limit < 0) {
        console.log('limit is not givine. setting it to 10')
        limit = 10;
    }

    //////////////////////////////////////////////////////
    // the user object should be valid (just double check)
    if (!user) {
        res.status(500).send({ message: "Invalid user object" })
    }

    const options = {};

    // add message filter 
    if (filter && filter.message && filter.message.length > 3) {
        options.message = new RegExp(filter.message, 'i')
    }

    // add level filter
    if (filter && filter.level && filter.level.length > 3) {
        options.level = filter.level.toLowerCase();
    }

    // add email filter 
    if (filter && filter.email && filter.email.length > 3) {
        options.email = new RegExp(filter.email, 'i')
    }

    // add user_ip filter 
    if (filter && filter.user_ip && filter.user_ip.length > 3) {
        options.user_ip = new RegExp(filter.user_ip, 'i')
    }

    // add timestamp filter 
    if (filter
        && filter.date_start && is_date(filter.date_start)
        && filter.date_end && is_date(filter.date_end)) {
        options.timestamp = {
            $gt: filter.date_start,
            $lt: filter.date_end
        }
    }

    console.log('options', options)

    Log.countDocuments(options, (err, totalCount) => {
        if (err) {
            console.error(err);
            res.json({ message: "Log.countDocuments failed.", err });
        }
        else {
            Log.find(options)
                //.select(['-json']) // exclude json field
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .exec((err, data) => {
                    if (err) {
                        console.error(err);
                        res.json({ message: "Log.find failed", err });
                    }
                    else {
                        res.json({
                            totalCount: totalCount,
                            list: data
                        });
                    }
                })

        }
    });
})

module.exports = router;
