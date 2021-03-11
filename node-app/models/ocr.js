const mongoose = require('mongoose');

const OCRSchema = mongoose.Schema(
    {
        app: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'App',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        success: {
            type: mongoose.Schema.Types.Boolean,
        },
        session_id: {
            type: String,
        },
        img_ext: {
            type: String,
        },
        req_mode: {
            type: String,
        },
        req_ip: {
            type: String,
        },
        num_pages: {
            type: Number,
            default: 0
        },
        num_words: {
            type: Number,
            default: 0
        },
        exec_ms: {
            type: Number,
            default: 0
        },
        file_size_mbyte: {
            type: Number,
            default: 0
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('OCR', OCRSchema);