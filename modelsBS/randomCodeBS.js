const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
const BSrandomCodeSchema = mongoose.Schema({
    phone: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    expire: {
        type: Date,
        default: Date.now,
        expires: 120
    }
});
module.exports = BSrandomCodeModel = mongoose.model('randomCode', BSrandomCodeSchema);