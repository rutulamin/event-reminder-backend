var jwt = require("jsonwebtoken");
const eventMiddleware = {};

eventMiddleware.verifyToken = function (req, res, next) {
    if(!req.headers.authorization) {   
      return res.status(401).send('Unauthorized request');
    }
    let token = req.headers.authorization.split(' ')[1];
    if(token === 'null') {
      return res.status(401).send('Unauthorized request');    
    }
    let payload = jwt.verify(token, '#$rutul$#');
    if(!payload) {
      return res.status(401).send('Unauthorized request')  ;  
    }
    if(payload.role !== 'user') {
      return res.status(401).send('Unauthorized request');
    }
    req.user_id = payload.subject;
    req.role = payload.role;
    next()
  }


eventMiddleware.checkRequiredField = function (req, res, next) {
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

module.exports = eventMiddleware;