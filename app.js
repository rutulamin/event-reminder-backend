const express = require("express"),
      app = express(),
      bodyParser = require("body-parser"),
      mongoose = require("mongoose"),
      bcrypt = require("bcrypt-nodejs"),
      cors = require("cors"),
      jwt = require("jsonwebtoken"),
      User = require("./models/user"),
      Event = require("./models/event")

mongoose.connect("mongodb://localhost:27017/EventReminder", {useNewUrlParser: true});
const corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}

app.use(cors(corsOptions))

app.use(bodyParser.json());

function verifyToken(req, res, next) {
    if(!req.headers.authorization) {   
      return res.status(401).send('Unauthorized request');
    }
    let token = req.headers.authorization.split(' ')[1];
    if(token === 'null') {
      return res.status(401).send('Unauthorized request');    
    }
    let payload = jwt.verify(token, 'rutul');
    if(!payload) {
      return res.status(401).send('Unauthorized request')  ;  
    }
    req.user_id = payload.subject;
    next()
  }

  app.get("/api/user",verifyToken, (req, res) => {
    User.findById(req.user_id, (err, data) => {
        if(err) {
            res.json({msg: "Error"});
        }
        else {
            res.json({userData: data})
        }
    });
})

app.post("/api/user/register", (req, res) => {  
    const hash = bcrypt.hashSync(req.body.password);
    const newuser = {
        fname: req.body.fname,
        lname: req.body.lname,
        username: req.body.username,
        password: hash,
        status: req.body.status,
        role: 'user'
     }; 

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
                    let payload = { subject: usersdata._id}
                    let token = jwt.sign(payload, 'rutul');
                    res.json({token: token});
                }
            )
        }
    })
});

app.post("/api/user/login", (req, res) => {
    value = false;
    User.findOne({ username: req.body.username }).exec( (err, data) => {
        if (err) {
            res.json({msg: "Error"});
        } 
        if(data.status == 'inactive') {
            res.json({msg: "Your account is deativaed!!"});
        } 
        if (!data) {
            res.json({msg: "Email Not Found"});
        } else {
            value = bcrypt.compareSync(req.body.password, data.password);
            if (value) {                
                let payload = { subject: data._id}
                let token = jwt.sign(payload, 'rutul');
                res.json({token: token});
            } else {
                res.json({msg: "Password is wrong"});
            }
        }
    });
});






app.post("/api/event/", verifyToken, (req, res) => {
    const obj = {
        title: req.body.title,
        fromdate: req.body.fromdate,
        todate: req.body.todate,
        category: req.body.category,
        repeat: req.body.repeat,
        description: req.body.description,
        offset: req.body.offset,
        type: req.body.type,
        user_id: req.user_id
    };
    Event.create(obj, (err, data) => {
        if(err) {
            res.json({msg: "Error"});
        }
    })   
})
app.listen(3000, () => {
    console.log("Server Started");
    
})