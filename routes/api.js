var request = require('request')
var Ticker = require('../models/ticker');
var Subs = require('../models/subscription');
var Price = require('../models/price');
var Alert = require('../models/alert');


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

			var googleArray = body.slice(0);
			var tickerArray = input.tickers.slice(0);
			findOrCreateTicker(input, tickerArray);

			res.send(body)
		}
	})
}

function getAllApi(){
	var tickers = ''
	Ticker.find({}, function(err, symbols) {
  	if (!err) {
  		symbols.forEach((symbolObj) => {
  			var text = symbolObj.symbol + ",";
  			tickers += text;
  		})
  	}
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
				console.log("SYM", symbols);
				createPriceEvent(symbols, googleArray);
			}
		});
  });
}

createAlertEvent = (subsToAlert, price_id, vol) => {
	//create alert history
	var sub = subsToAlert.pop();
	console.log("ALERTTTT", sub);
	Alert.create({user_id: sub.user_id, price_id: price_id, symbol: sub.symbol, volatility: vol});

	//(sub['user_id'], sub['symbol'], currentPrice, prevPrice)

	if (subsToAlert.length > 0) {
		createAlertEvent(subsToAlert, price_id, vol);
	}
}

getAlerts = (req, res) => {
	var user = req.query.user_id;
	var result = [];
	var processed = 0;
	Alert.find({ user_id: user }, function(err, alerts){
		alerts.forEach((alert, index, array) => {
			Price.findOne({ _id: alert.price_id }, function(err, priceModel){
				result.push({
					user_id: alert.user_id,
					symbol: alert.symbol,
					volatility: alert.vol,
					price: priceModel.price,
				})
				processed++;

				if (processed === alerts.length){
					console.log("DONE!!!", result)
					res.status(200).send(result);
				}
			})
		});
	});
}

createPriceEvent = (tickers, googleArray) => {
	var tickerObj = tickers.pop();
	var apiObj = googleArray.pop();
	if (tickerObj.symbol.split(':')[1] === apiObj['t']) {
		console.log("symbols match.")
		calculatePercentage(tickerObj._id, parseFloat(apiObj['l']), function(_id, ticker_id, currentPrice, prevPrice, vol) {
			
			//find all users who (1) are watching the ticker, and (2) have met the vol percent trigger.
			Subs.find({ticker_id: ticker_id, isWatching: true}, function(err, subsToAlert) {
			//Subs.find({ticker_id: _id, percent_setting:{$lte: vol}, isWatching: true}, function(err, subsToAlert){
				console.log("SUBS TO BE ALERTED", subsToAlert)
				console.log("CUR P ", currentPrice)
				console.log("PREV P ", prevPrice)
				createAlertEvent(subsToAlert, _id, vol);
			})
		});
		Price.create({ticker_id: tickerObj._id, price: parseFloat(apiObj['l'])});
	} else {
		console.log("CRITICAL ERROR IN FETCHING PRICE FOR getAllApi.")
	}
	if (tickers.length > 0 || googleArray.length > 0) {
		createPriceEvent(tickers, googleArray);
	}
}

calculatePercentage = (_id, currentPrice, cb) => {
	var now = new Date();
	var intervalMinute = 1;
	var time = now.setMinutes(now.getMinutes() - intervalMinute*2);
	Price.findOne({ticker_id: _id, created_at: {$gte: time}}, function(err, prevEvent) {
		if (err || !prevEvent){console.log("Could not find previous event."); return;}
		var prevPrice = prevEvent.price
		var vol = (Math.abs(currentPrice - prevPrice) / prevPrice).toFixed(4)*100
		console.log("prevEvent ", prevEvent)
		console.log("DIFF ", vol)
		if (Math.abs(vol) >= 0.00){ //keep to 0.01
			cb(prevEvent._id, _id, currentPrice, prevPrice, vol);
		}	
	})
}

findOrCreateTicker = (input, tickerArray) => {
	var gTicker = tickerArray.pop();

	Ticker.findOrCreate({symbol : gTicker.symbol}, function(err, found, created) {
		if (!created) {
			console.log("symbol already exists.");
		}
		Subs.update({
			user_id: input.user_id,
			symbol : gTicker.symbol,
			ticker_id: found._id
		}, {
			percent_setting: gTicker.volPercent,
			isWatching: true
		}, {
			upsert: true,
			setDefaultsOnInsert: true
		}, function(err, sub) {
			if (err) console.log("Subscription error! ", err);
			console.log("sub", sub)
		});

		if (tickerArray.length > 0) {
			findOrCreateTicker(input, tickerArray);
		} 	
	})
}

module.exports = {
	getApi: getApi,
	getAllApi: getAllApi,
	getAlerts: getAlerts
}