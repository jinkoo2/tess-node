const mongoose = require('mongoose');

const LogSchema = mongoose.Schema(
    {
        timestamp: { type: Date, default: new Date() },
        level: String,
        message: String,
        session_id: String,
        user_ip: String,
        email: String,
        app_name: String,
        url: String,
        error: Object,
        meta: Object,
    },
);

LogSchema.index({ level: 'text', message: 'text', email: 'text', user_ip: 'text', app_name: 'text', session_id: 'text', url: 'text' });


module.exports = mongoose.model('Log', LogSchema);