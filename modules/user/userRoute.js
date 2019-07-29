const express = require('express'),
      router = express.Router(),
      User = require('./userModel'),
      userMiddleware = require('./userMiddleware'),
      jwt = require("jsonwebtoken"),
      bcrypt = require('bcrypt-nodejs')

router.get("/", userMiddleware.verifyToken, (req, res) => {
    User.findById(req.user_id, (err, data) => {
        if(err) {
            res.json({msg: "Error"});
        }
        else {
            res.json({userData: data})
        }
    });
})

router.post("/register", (req, res) => {  
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
                    let token = jwt.sign(payload, '#$rutul$#');
                    res.json({token: token});
                }
            )
        }
    })
});

router.post("/login", (req, res) => {
    value = false;
    User.findOne({ username: req.body.username }).exec( (err, data) => {
        if (err) {
            res.json({msg: "Error"});
        } 
        if (!data) {
            res.json({msg: "Email Not Found"});
        } else {
            value = bcrypt.compareSync(req.body.password, data.password);
            if (value) {
                if(data.status == 'inactive') {
                    res.json({msg: "Your account is deativaed!!"});
                }                 
                let payload = { subject: data._id}
                let token = jwt.sign(payload, '#$rutul$#');
                res.json({token: token});
            } else {
                res.json({msg: "Password is wrong"});
            }
        }
    });
});

module.exports = router;