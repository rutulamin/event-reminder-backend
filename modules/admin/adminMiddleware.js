var jwt = require("jsonwebtoken");
const adminMiddleware = {};

adminMiddleware.verifyToken = function (req, res, next) {

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
    next();
    
  }

module.exports = adminMiddleware;