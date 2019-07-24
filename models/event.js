var mongoose = require("mongoose");

var eventSchema = new mongoose.Schema
({
    title: String,
    fromdate: String,
    todate: String,
    category: String,
    repeat: String,
    description: String,
    offset: Number,
    type: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }    
});

module.exports = mongoose.model("event", eventSchema);