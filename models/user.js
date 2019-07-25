var mongoose = require("mongoose");

var userSchema = new mongoose.Schema
({
    fname: String,
    lname: String,
    username: String,
    password: String,
    status: String,
    role: String    
});

module.exports = mongoose.model("user", userSchema);