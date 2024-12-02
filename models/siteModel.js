const mongoose = require('mongoose')

const Schema = mongoose.Schema

const siteSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: true
    }
},{ timestamps: true })

module.exports = mongoose.model('Site', siteSchema)
