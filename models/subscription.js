var mongoose = require('mongoose');
var Schema = mongoose.Schema

var subscriptionSchema = new Schema({
	ticker_id : {
		type: Schema.Types.ObjectId,
		ref: 'Ticker' 
	},
	user_id : String,
	percent_setting : Number,
	isWatching : Boolean
}, { timestamps: { createdAt: 'created_at' } });

var Subscription = mongoose.model("subscription", subscriptionSchema)

module.exports = Subscription