var request = require('request')
var Ticker = require('../models/ticker');
var Subs = require('../models/subscription');
var Price = require('../models/price');
var ticker_id_array;
var volPercent_array;

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

			var googleArray = body.slice(0);
			var tickerArray = input.tickers.slice(0);
			ticker_id_array = [];
			volPercent_array = [];
			findOrCreateTicker(input, tickerArray, function(result){
				console.log("RESULTTT", result)
			})


			console.log(typeof body)
			res.send(body)
		}
	})
}

function getAllApi(){
	var tickers = ''
	Ticker.find({}, function(err, symbols) {
    	if (!err) {
    		symbols.forEach((symbolObj) => {
    			var text = symbolObj['symbol'] + ",";
    			tickers += text;
    		})
    	}
    	console.log("tickers", tickers)
    	var URL = ("http://finance.google.com/finance/info?client=ig&q="+tickers);

    	request.get({
			url: URL
		}, function(err, response, body) {
			if (body.indexOf("httpserver.cc: Response Code 400") >= 0) {
				console.log("Invalid ticker")
				return;
			} else {
				body = body.substring(3);
				body = JSON.parse(body);
				console.log("ALLAPI BODY : ", body)
				var googleArray = body.slice(0);
				console.log("SYM", symbols)
				createPriceEvent(symbols, googleArray)
			}
		})
    });
}

createPriceEvent = (tickers, googleArray) => {
	var tickerObj = tickers.pop();
	var apiObj = googleArray.pop();
	if (tickerObj["symbol"].split(':')[1] === apiObj['t']){
		console.log("symbols match.")
		Price.create({ticker_id: tickerObj["_id"], price: parseFloat(apiObj["l"])})
	} else {
		console.log("CRITICAL ERROR IN FETCHING PRICE FOR getAllApi.")
	}

	if (tickers.length > 0 || googleArray.length > 0){
		createPriceEvent(tickers, googleArray);
	}
}


findOrCreateTicker = (input, tickerArray, cb) => {
	var gTicker = tickerArray.pop()

	Ticker.findOrCreate({symbol : gTicker['symbol']}, function(err, found, created){
		if (!created){
			console.log("symbol already exists.");
		}
		Subs.update({user_id: input.user_id, ticker_id: found._id}, {percent_setting: gTicker['volPercent'], isWatching: true}, {upsert: true, setDefaultsOnInsert: true}, function(err, sub){
			if (err) console.log("Subscription error! ", err);
			console.log("sub", sub)
		})

		ticker_id_array.push(found._id);
		volPercent_array.push(gTicker['volPercent'])

		if (tickerArray.length > 0){
			findOrCreateTicker(input, tickerArray, cb)
		} else {
			console.log("ARRAYYY", ticker_id_array)
			console.log("vollll", volPercent_array)
		}	
	})
	
}

module.exports = {
	getApi: getApi,
	getAllApi: getAllApi
}