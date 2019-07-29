var mongoose = require("mongoose");

var userSchema = new mongoose.Schema
({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },    
});

module.exports = mongoose.model("user", userSchema);