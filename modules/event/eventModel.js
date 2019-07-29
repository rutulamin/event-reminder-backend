var mongoose = require("mongoose");

var eventSchema = new mongoose.Schema
({
    title: {
        type: String,
        required: true
    },
    startdate: {
        type: String,
        required: true
    },
    enddate: String,
    category: {
        type: String,
        required: true
    },
    repeat: {
        type: String,
        required: true
    },
    location: String,
    description: String,
    offset: Number,
    type: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    }    
});

module.exports = mongoose.model("event", eventSchema);