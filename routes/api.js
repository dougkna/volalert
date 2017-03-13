var request = require('request')
var Ticker = require('../models/ticker');
var Subs = require('../models/subscription');

function getApi(req, res){
	var tickers = '';
	var input = req.query.input;
	console.log("TOTAL REQ RECEIVED : ", input)
	for (var i = 0 ; i < input.tickers.length ; i++){
		var text = input.tickers[i]['symbol'] + ",";
		tickers += text;
	};
	var URL = ("http://finance.google.com/finance/info?client=ig&q="+tickers);
	console.log("path::: ", URL);

	request.get({
		url: URL
	}, function(err, response, body) {
		if (body.indexOf("httpserver.cc: Response Code 400") >= 0) {
			console.log("Invalid ticker")
			return;
		} else {
			body = body.substring(3);
			body = JSON.parse(body);
			console.log("BODY", body)
			console.log("BODY.length", body.length)

			findOrCreateTicker(input, body, function(result){
				console.log("RESULTTT", result)
			})
			//createOrUpdateSubs()



			console.log(typeof body)
			res.send(body)
		}
	})
}

findOrCreateTicker = (input, body, cb) => {
	for (var j = 0 ; j < body.length ; j++){
		Ticker.findOrCreate({symbol : body[j]['t']}, function(err, found, created){
			if (!created){
				console.log("symbol already exists.")
			}
			console.log("created", created)
			console.log('A new ticker "%s" was inserted', found.symbol);
			console.log("each volPercent", input.tickers[2]['volPercent'])
			createSubs(input.user_id, found._id, input.tickers[2]['volPercent'])
			//found._id
		})
	}
}

createSubs = (user_id, ticker_id, percent_setting) => {
	Subs.create({user_id: user_id, ticker_id: ticker_id, percent_setting: percent_setting}, function(err, sub){
		if (err) console.log("Subscription error! ", err);
		console.log("sub", sub)
	})
}

module.exports = {
	getApi: getApi
}