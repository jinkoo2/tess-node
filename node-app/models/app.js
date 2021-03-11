const mongoose = require('mongoose');

const AppSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        active: {
            type: Boolean,
            default: true
        },
        num_reqs: {
            type: Number,
            default: 0
        },
        num_pages: {
            type: Number,
            default: 0
        },
        num_words: {
            type: Number,
            default: 0
        },
        total_sec: {
            type: Number,
            default: 0
        },
        total_mbyte: {
            type: Number,
            default: 0
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('App', AppSchema);