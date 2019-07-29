const express = require('express'),
      router = express.Router(),
      Event = require('./eventModel'),
      eventMiddleware = require('./eventMiddleware'),
      mongoose = require('mongoose'),
      moment = require('moment-timezone'),
      rrule = require('rrule'),
      _ = require('lodash')

router.get("/", eventMiddleware.verifyToken, (req,res) => {
    
    Event.find({ user_id: mongoose.Types.ObjectId(req.user_id) }, (err, data) => {        
        if(err) {
            return res.status(400).send('Data not found from database.');
        }
        todayEvent = [];
        upcomingEvent = [];
        oldEvent = [];
        todayReminder = [];
        upcomingReminder = [];
        oldReminder = [];

        for (let i = 0; i < data.length; i++) {
            if(data[i].type === 'event') {
                const rrule1 = getRule(data[i].startdate, data[i].repeat);
                const rule = new rrule.RRule(rrule1);
                const endtime = moment(data[i].enddate, 'YYYY-MM-DD HH:mm:ss', true).format('HH:mm:ss');
                rule.all().forEach(
                    (date) => {                        
                        const d1 = new Date(date).toISOString();
                        const date1 = moment(d1.toString()).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss');
                        const d2 = moment(date1, 'DD-MM-YYYY').add(parseInt(data[i].offset), 'days');
                        const enddate = d2.format('DD-MM-YYYY') + ' ' + endtime;
                        // console.log(date, d1, date1, d2, enddate);
                        let obj = {};
                        obj = {
                            id: data[i]._id,
                            title: data[i].title,
                            location: data[i].location,
                            category: data[i].category,
                            startdate: date1,
                            enddate: enddate,
                            repeat: data[i].repeat,
                            type: data[i].type
                        };
                        if(moment(moment().format('YYYY-MM-DD')).isBetween(moment(d1.toString()).format('YYYY-MM-DD'), d2.format('YYYY-MM-DD')) || 
                        moment(moment().format('YYYY-MM-DD')).isSame(moment(d1.toString()).format('YYYY-MM-DD'))) {
                            todayEvent.push(obj);
                        } else if(moment(moment().format('YYYY-MM-DD')).isAfter(d2.format('YYYY-MM-DD'))) {
                            oldEvent.push(obj);
                        } else if (moment(moment().format('YYYY-MM-DD')).isBefore(moment(d1.toString()).format('YYYY-MM-DD'))) {
                            upcomingEvent.push(obj);
                        }
                    }
                );            
            } else if (data[i].type === 'reminder') {
                const rrule1 = getRule(data[i].startdate, data[i].repeat);
                const rule = new rrule.RRule(rrule1);
                rule.all().forEach(
                    (date) => {
                        const d1 = new Date(date).toISOString();
                        const date1 = moment(d1.toString()).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss');;
                        let obj = {};
                        obj = {
                            id: data[i]._id,
                            title: data[i].title,
                            category: data[i].category,
                            startdate: date1,
                            repeat: data[i].repeat,
                            type: data[i].type
                        }; 
                        if(moment(moment().format('YYYY-MM-DD')).isSame(moment(d1.toString()).format('YYYY-MM-DD'))) {
                            todayReminder.push(obj);
                        } else if(moment().isAfter(moment(d1.toString()).format('YYYY-MM-DD'))) {
                            oldReminder.push(obj);
                        } else if (moment().isBefore(moment(d1.toString()).format('YYYY-MM-DD'))) {
                            upcomingReminder.push(obj);
                        }
                    }
                );            
            
            } else {
                return res.status(400).send('Event have not valid type');
            }   
        }
        
        return res.status(200).json({
            data: {
                todayEvent: sort_array(todayEvent),
                oldEvent: reverse_sort_array(oldEvent),
                upcomingEvent: sort_array(upcomingEvent),
                todayReminder: sort_array(todayReminder),
                oldReminder: reverse_sort_array(oldReminder),
                upcomingReminder: sort_array(upcomingReminder)
            }
        });

    });
});

router.post("/", [eventMiddleware.checkRequiredField, eventMiddleware.verifyToken], (req, res) => {
    
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
        user_id: mongoose.Types.ObjectId(req.user_id)
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


function getRule(startdate, repeat) {

    const monthday = parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('DD'));
    const month = parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('MM'));
    const weekday1 = parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).weekday());
    
    const weekday = setWeekday(weekday1);
    // console.log(weekday);
    
    const UTCDate = new Date(
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('YYYY')),
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('MM')) - 1,
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('DD')),
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('HH')),
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format('mm')),
        parseInt(moment(startdate, 'YYYY-MM-DD HH:mm:ss',true).format("ss"))
    );
    const cyear = UTCDate.getFullYear();
    const cmonth = UTCDate.getMonth();
    const cday = UTCDate.getDate();

    const until = new Date(cyear + 1, cmonth + 1, cday);

      // console.log('startdate', startdate, UTCDate);  
    switch (repeat) {
        case 'Does not repeat':
            return {
                dtstart: UTCDate,
                count: 1,
                tzid: 'Asia/Kolkata'
             };
            break;
        case 'Daily':
            return {
                freq: rrule.RRule.DAILY,
                dtstart: UTCDate,
                tzid: 'Asia/Kolkata',
                until: until
                // count: count
            };
            break;
        case 'Weekly':
            return {
                freq: rrule.RRule.WEEKLY,
                dtstart: UTCDate,
                byweekday: [weekday],
                tzid: 'Asia/Kolkata',
                until: until
                // count: count,
            };
            break;
        case 'Monthly':
            return {
                freq: rrule.RRule.MONTHLY,
                dtstart: UTCDate,
                bymonthday: [monthday],
                tzid: 'Asia/Kolkata',
                until: until
                // count: count
            };
            break;
        case 'Yearly':
            return {
                freq: rrule.RRule.YEARLY,
                dtstart: UTCDate,
                bymonthday: [monthday],
                bymonth: [month],
                tzid: 'Asia/Kolkata',
                until: until
                // count: count
            };
        default:
            return {
                dtstart: UTCDate,
                tzid: 'Asia/Kolkata',
                count: 1
            }
            break;
    }
}

function sort_array(array) {
    array = _.sortBy(array, (o) => {
        { return new moment(o.startdate, 'DD-MM-YYYY HH:mm:ss', true); }
    });
    return array;
}

function reverse_sort_array(array) {
    array = _.sortBy(array, (o) => {
        { return new moment(o.startdate, 'DD-MM-YYYY HH:mm:ss', true); }
    }).reverse();
    return array;
}

module.exports = router;