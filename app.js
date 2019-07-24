const express = require("express"),
      app = express(),
      bodyParser = require("body-parser"),
      mongoose = require("mongoose"),
      bcrypt = require("bcrypt-nodejs"),
      cors = require("cors"),
      User = require("./models/user"),
      Event = require("./models/event")

mongoose.connect("mongodb://localhost:27017/EventReminder", {useNewUrlParser: true});
const corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}

app.use(cors(corsOptions))

app.use(bodyParser.json());


app.post("/api/user/register", (req, res) => {
    //console.log(req.body);
    
    const hash = bcrypt.hashSync(req.body.pasword);
    const newuser = { fname: req.body.fname, lname: req.body.lname, username: req.body.username, password: hash, status: req.body.status };                                       
    //console.log(newuser.fname);
    
    User.findOne({ username: newuser.username }, (err, data) => {
        if(err) {
            res.json({msg: "Error"});
        }
        if(data) {
            res.json({msg: "User is already Registered!"});
        } else {
            User.create(newuser, (err, usersdata) => {
                    if (err) {
                        res.json({msg: "Error"});
                    }
                    res.json({msg: "Signup Successfully", userdata: usersdata})

                }
            )
        }
    })

    // res.send(req.body);
    // console.log("response")
    // res.send("inside node code")

});




app.post("/api/event", (req, res) => {
    console.log(req);
    
    // Validate request
    
})
app.listen(3000, () => {
    console.log("Server Started");
    
})