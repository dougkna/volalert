var User = require('../models/user');
var crypto = require('crypto')

function signup(req, res) {

  //prevent duplicate ID's
  User.findOne({id: req.body.id}, function(err, duplicate) {
    if (duplicate) {
      res.status(401).send();
    }
  })

  var hash = crypto.createHash('md5').update(req.body.password).digest('hex');
  req.body.password = hash;

  User.create(req.body, function(err, user) {
    if (err) {
      res.send("err");
      return;
    }
    res.status(200).send();
  })
}

function login(req, res) {
    console.log("req.body : "+JSON.stringify(req.body));
    var rand = Math.random().toString(36).substring(7);
    
   try {
    User.findOneAndUpdate({email: req.body.email}, {$set: {token: rand}}, {new: true}, function(err, user) {
        if (err) { res.send("error")
            console.log("error");
        }
        if (user == null) {
            res.send("noUser");
            return;
        } 
        if (user.password == crypto.createHash('md5').update(req.body.password).digest('hex')) {
            var result = {
              success: true,
              token: rand,
              first_name: user.first_name,
              user_id: user.id,
            };

            res.send(result);
            return;
        } else {
            res.send("error");
            return;
        }
    })
    } catch (e) {
        console.log("ERROR!!!", err);
        console.log("STACK", err.stack);
    }
}

function getUser(req,res) {
  User.findOne({token : req.query.token}, function(err, user) {
    if (err) {
      res.send("error");
      return;
    }
    if (user) {
      console.log(`user first_name is :: ${user.first_name}`);
      res.json({first_name : user.first_name, id : user.id});

    }
  })
}

module.exports = {
  signup : signup,
  login : login,
  getUser : getUser
}