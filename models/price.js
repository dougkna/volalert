var mongoose = require('mongoose');
var Schema = mongoose.Schema

var priceSchema = new Schema({
	ticker_id : String,
	price : String,
}, { timestamps: { createdAt: 'created_at' } });

var Price = mongoose.model("price", priceSchema)

module.exports = Price