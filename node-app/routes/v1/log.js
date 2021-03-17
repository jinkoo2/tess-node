const express = require("express");
const router = express.Router();
const authorizedUserOnly = require('../../security/authorizedUserOnly')
const authorizedAdminOnly = require('../../security/authorizedAdminOnly')

const ERROR_CODE = require('../../error_code')
const { err, scc } = require('../../utils/helper');

const emailer = require('../../providers/emailer')

const email_template_loader = require('../../providers/email_template_loader')
const new_app_template_loader = email_template_loader.get_loader("new_app")

const Log = require('../../models/log');

router.post("/", authorizedUserOnly, authorizedAdminOnly, (req, res, next) => {

    //////////////////////////////
    // input parameters
    // 
    // user_token --> authorizedUserOnly converts user_token to req.user object 
    const user = req.user; // from user_token 
    let { skip, limit } = req.body;

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
