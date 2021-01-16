const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.set('useFindAndModify', false);

const BSLogSchema = mongoose.Schema({
    typeID:{ // User:1, Station: 2, Battery: 3, LoginToApp: 4
        type: Number,
        require: true
    },
    type:{ // insert:1, update: 2, delete: 3, login: 4
        type: Number,
        require: true
    },
    field:{
        type: String
    },
    before:{
        type: String
    },
    after:{
        type: String
    },
    changeDate:{
        type: String,
        require: true
    },
    userID:{
        type: Schema.Types.ObjectId,
        ref: 'profile'
    }
});

module.exports = BSLog = mongoose.model('log', BSLogSchema);