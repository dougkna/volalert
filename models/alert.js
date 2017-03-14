var mongoose = require('mongoose');
var Schema = mongoose.Schema

var alertSchema = new Schema({
	price_id : {
		type: Schema.Types.ObjectId,
		ref: 'Price' 
	},
	name : String,
	user_id : String,
	symbol : String,
	volatility : Number,
	fresh : Boolean
}, { timestamps: { createdAt: 'created_at' } });

var Alert = mongoose.model("alert", alertSchema)

module.exports = Alert