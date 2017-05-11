var mongoose = require('mongoose');
var Schema = mongoose.Schema
var findOrCreate = require('mongoose-findorcreate')

var tickerSchema = new Schema({
	symbol : { type: String, unique: true }
}, { timestamps: { createdAt: 'created_at' } });

tickerSchema.plugin(findOrCreate);
var Ticker = mongoose.model("ticker", tickerSchema);

module.exports = Ticker