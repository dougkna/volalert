var mongoose = require('mongoose');
var Schema = mongoose.Schema

var userSchema = new Schema({
      first_name: String,
      last_name: String,
      id: String,
      slack_id: String,
      email: String,
      password: String,
      token: String
	
}, { timestamps: { createdAt: 'created_at' } });

var User = mongoose.model("user", userSchema)

module.exports = User