const mongoose = require('mongoose');

const LogSchema = mongoose.Schema(
    {
        timestamp: Date,
        level: String,
        message: String,
        meta: Object,
    },
);

module.exports = mongoose.model('Log', LogSchema);