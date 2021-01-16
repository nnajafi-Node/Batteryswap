const mongoose = require('mongoose')
const reserveSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'profile'
    },
    batteries:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'battery'
    }],
    date:{
        type:Date,
        default:Date.now,
        expires: 60*30
    }

})
module.exports = mongoose.model('reserve',reserveSchema);