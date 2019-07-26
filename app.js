const express = require("express"),
      app = express(),
      bodyParser = require("body-parser"),
      mongoose = require("mongoose"),
      bcrypt = require("bcrypt-nodejs"),
      cors = require("cors"),
      moment = require("moment-timezone"),
      rrule = require("rrule");
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

  function checkRequiredField(req, res, next) {
    if (req.body.type !== '') {
        if(req.body.type === 'event') {
            if( req.body.title !== '' && req.body.startdate !== '' && req.body.enddate !== ''
            && req.body.category !== '' && req.body.repeat !== '' && req.body.offset !== '') {
                next();
            }
            else {
                return res.status(400).send('Please verify form data and resubmit it.');
            }
        } else if (req.body.type === 'reminder') {
            if( req.body.title !== '' && req.body.startdate !== '' && req.body.category !== '' 
            && req.body.repeat !== '' ) {
                next();
            }
            else {
                return res.status(400).send('Please verify form data and resubmit it.');
            }
        } else {
            return res.status(400).send('please set type to event or reminder.');
        }
    } else {
        return res.status(400).send('Event type must be required.');
    }       
  }

function setWeekday(day) {
    switch (day) {
        case 0:
            return rrule.RRule.SU;
            break;
        case 1:
            return rrule.RRule.MO;
            break;
        case 2:
            return rrule.RRule.TU;
            break;
        case 3:
            return rrule.RRule.WE;
            break;
        case 4:
            return rrule.RRule.TH;
            break;
        case 5:
            return rrule.RRule.FR;
            break;
        case 6:
            return rrule.RRule.SA;
            break;
        default:
            break;
    }
}

const rrule1 = getRule("2019-07-26 10:00:00", 'Weekly');
const rule = new rrule.RRule(rrule1);
                rule.all().forEach(
                    (date) => {
                       console.log(date);
                    }
                );   
function getRule(startdate, repeat) {

    const monthday = parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('DD'));
    const month = parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('MM'));
    const weekday1 = parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).weekday());
    console.log(weekday1);
    
    console.log(rrule.RRule.MO);
    
    const weekday = setWeekday(weekday1);
    // console.log(weekday);
    
    const UTCDate = new Date(Date.UTC(
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('YYYY')),
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('MM')) - 1,
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('DD')),
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('HH')),
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('mm')),
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format("ss"))
    ));

        
    switch (repeat) {
        case 'Does not repeat':
            return { };
            break;
        case 'Daily':
            return {
                freq: rrule.RRule.DAILY,
                dtstart: UTCDate,
                count: 30,
            };
            break;
        case 'Weekly':
            return {
                freq: rrule.RRule.WEEKLY,
                dtstart: UTCDate,
                byweekday: weekday,
                count: 30,
            };
            break;
        case 'Monthly':
            return {
                freq: rrule.RRule.MONTHLY,
                bymonthday: [monthday],
                count: 30,
                dtstart: UTCDate
            };
            break;
        case 'Yearly':
            return {
                freq: rrule.RRule.YEARLY,
                bymonthday: [monthday],
                bymonth: [month],
                count: 30,
                dtstart: UTCDate
            };
        default:
            break;
    }
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
        if (!data) {
            res.json({msg: "Email Not Found"});
        } else {
            value = bcrypt.compareSync(req.body.password, data.password);
            if (value) {
                if(data.status == 'inactive') {
                    res.json({msg: "Your account is deativaed!!"});
                }                 
                let payload = { subject: data._id}
                let token = jwt.sign(payload, 'rutul');
                res.json({token: token});
            } else {
                res.json({msg: "Password is wrong"});
            }
        }
    });
});

app.get("/api/event", (req,res) => {
    Event.find({ user_id: mongoose.Types.ObjectId("5d39a061ceab787029f711a5") }, (err, data) => {
         //console.log(data);
        
        if(err) {
           // console.log(err);
            
            return res.status(400).send('Data not found from database.');
        }
        resData = [];
        for (let i = 0; i < data.length; i++) {

            // console.log(data[i].type);
            if(data[i].type === 'event') {
                const rrule1 = getRule(data[i].startdate, data[i].repeat);
                const rule = new rrule.RRule(rrule1);
                rule.all().forEach(
                    (date) => {
                        console.log(date);
                    }
                );            
            
            } else if (data[i].type === 'reminder') {
    
            } else {
                return res.status(400).send('Event have not valid type');
            }
            
        }
        
    })
});

app.post("/api/event/", [checkRequiredField, verifyToken], (req, res) => {
    
    const obj = {
        title: req.body.title,
        startdate: req.body.startdate,
        enddate: req.body.enddate,
        category: req.body.category,
        repeat: req.body.repeat,
        location: req.body.location,
        description: req.body.description,
        offset: req.body.offset,
        type: req.body.type,
        user_id: req.user_id
    };
    Event.create(obj, (err, data) => {
        if(err) {
            return res.status(400).send('Data not inserted in database.');
        }
        if(data.type === 'event') {
            res.status(200).json({msg: "Event created succesfully!!!"});
        } else {
            res.status(200).json({msg: "Reminder created succesfully!!!"});
        }
    })   
})

app.listen(3000, () => {
    console.log("Server Started");
    
})