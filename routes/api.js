var request = require('request')
var Ticker = require('../models/ticker');
var Subs = require('../models/subscription');
var Price = require('../models/price');
var Alert = require('../models/alert');


function test(msg) {
	request({
		url: 'https://hooks.slack.com/services/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',
		method: 'POST',
		body: { text: msg },
    json: true
	}, function(err, httpResponse, body) {
		console.log("request.post: ", body);
	});
}


function getApi(req, res) {
	var tickers = '';
	var input = req.query.input;
	for (var i = 0 ; i < input.tickers.length ; i++) {
		var text = input.tickers[i]['symbol'] + ",";
		tickers += text;
	};
	var URL = ("http://finance.google.com/finance/info?client=ig&q="+tickers);

	request.get({
		url: URL
	}, function(err, response, body) {
		if (body.indexOf("httpserver.cc: Response Code 400") >= 0) {
			console.log("Invalid ticker");
			return;
		} else {
			body = body.substring(3);
			body = JSON.parse(body);

			var googleArray = body.slice(0);
			var tickerArray = input.tickers.slice(0);
			findOrCreateTicker(input, tickerArray);

			res.send(body);
		}
	})
}

function getAllApi() {
	var tickers = ''
	Ticker.find({}, function(err, symbols) {
  	if (!err) {
  		symbols.forEach((symbolObj) => {
  			var text = symbolObj.symbol + ",";
  			tickers += text;
  		});
  	}
  	var URL = ("http://finance.google.com/finance/info?client=ig&q="+tickers);

    request.get({
			url: URL
		}, function(err, response, body) {
			if (body.indexOf("httpserver.cc: Response Code 400") >= 0) {
				console.log("Invalid ticker for getAllApi");
				return;
			} else {
				body = body.substring(3);
				body = JSON.parse(body);
				var googleArray = body.slice(0);
				createPriceEvent(symbols, googleArray);
			}
		});
  });
}

createAlertEvent = (subsToAlert, price_id, vol) => {
	var sub = subsToAlert.pop();
	console.log("create ALERT for :", sub);
	Alert.create({user_id: sub.user_id, price_id: price_id, symbol: sub.symbol, name: sub.name, 
		volatility: vol, fresh: true});
	// Alert.update({user_id: sub.user_id, price_id: price_id, symbol: sub.symbol, name: sub.name}, 
	// {volatility: vol}, {upsert: true, setDefaultsOnInsert: true}, function(err, alertModel) {
	// 	if (err) console.log("Alert update error! ", err);
	// 	console.log("ALERT MODEL", alertModel)
	// });

	if (subsToAlert.length > 0) {
		createAlertEvent(subsToAlert, price_id, vol);
	}
}

getSavedTickers = (req, res) => {
	var user = req.query.user_id;
	Subs.find({user_id: user}, function(err, subs) {
		res.send(subs);
	})
}

refreshPrice = (req, res) => {
	var user = req.query.user_id;
	var result = [];
	var processed = 0;

	Subs.find({ user_id: user, isWatching: true }, function(err, subs) {
		subs.forEach((sub) => {
			//findOne will be much faster here
			Price.find({ticker_id: sub.ticker_id}, function(err, priceModel) {
				if (priceModel) {
					result.push({ symbol: sub.symbol, price: priceModel[0].price });
				}
				processed++;

				if (processed === subs.length) {
					res.status(200).send(result);
				}
			}).sort({$natural:-1}).limit(1);
		});
	});
}

getAlerts = (req, res) => {
	var user = req.query.user_id;
	var result = [];
	var processed = 0;
	Alert.find({ user_id: user, fresh: true }, function(err, alerts) {
		alerts.forEach((alert, index, array) => {
			Price.findOne({ _id: alert.price_id }, function(err, priceModel) {
				if (priceModel) {
					result.push({
						name: alert.name,
						user_id: alert.user_id,
						symbol: alert.symbol,
						volatility: alert.volatility,
						price: priceModel.price,
					});
					processed++;

					if (processed === alerts.length) {
						res.status(200).send(result);

						Alert.update({user_id: user, fresh: true}, {fresh: false}, {upsert: true, multi: true}, 
						function(err, alertModel) {
							if (err) console.log("Alert update error: fresh => false ", err);
						})
					}
				}
			});
		});
	});
}

createPriceEvent = (tickers, googleArray) => {
	var tickerObj = tickers.pop();
	var apiObj = googleArray.pop();
	if (tickerObj.symbol.split(':')[1] === apiObj['t']) {
		calculatePercentage(tickerObj._id, apiObj['l_fix'], function(ticker_id, price_id, vol) {		
			//find all users who (1) are watching the ticker, and (2) have met the vol percent trigger.
			Subs.find({ticker_id: ticker_id, percent_setting:{$lte: vol}, isWatching: true}, 
			function(err, subsToAlert) { // percent_setting:{$lte: vol},
				if (subsToAlert.length) {
					createAlertEvent(subsToAlert, price_id, vol);
				}
			});
		});
		Price.create({ticker_id: tickerObj._id, price: apiObj['l_fix']});
	} else {
		console.log("CRITICAL ERROR IN FETCHING PRICE FOR getAllApi.");
	}
	if (tickers.length > 0 || googleArray.length > 0) {
		createPriceEvent(tickers, googleArray);
	}
}

calculatePercentage = (ticker_id, currentPrice, cb) => {
	var now = new Date();
	var intervalSeconds = 60;
	var time = now.setSeconds(now.getSeconds() - (intervalSeconds + 5));
	Price.findOne({ticker_id: ticker_id, created_at: {$gte: time}}, function(err, prevEvent) {
		if (err || !prevEvent) return;
		var prevPrice = parseFloat(prevEvent.price).toFixed(4)*1;
		var currPrice = parseFloat(currentPrice).toFixed(4)*1;
		var vol = (Math.abs(currPrice - prevPrice) / prevPrice).toFixed(4)*100;
		if (vol >= 0.50) { //keep to 0.50 for 0.5% for minimum alert trigger
			cb(ticker_id, prevEvent._id, vol);
		}	
	});
}

findOrCreateTicker = (input, tickerArray) => {
	var gTicker = tickerArray.pop();

	Ticker.findOrCreate({symbol : gTicker.symbol}, function(err, found, created) {
		if (!created) {
			console.log("symbol already exists.");
		}
		Subs.update({
			user_id: input.user_id,
			name : gTicker.name,
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
		});

		if (tickerArray.length > 0) {
			findOrCreateTicker(input, tickerArray);
		} 	
	});
}

stopWatching = (req, res) => {
	var user = req.body.input;
	Subs.update({user_id: user}, {isWatching: false}, {upsert: true, multi: true}, function(err, sub) {
		if (err) {
			console.log("Subscription error! ", err);
		} else {
			res.send("OFF");
		}
	});
}

deleteSubs = (req, res) => {
	var user_id = req.body.user_id;
	var symbol = req.body.symbol;
	Subs.find({user_id: user_id, symbol: symbol}).remove().exec();
	res.send("Deleted");
}

//Clean up Ticker model periodically in order to account for any deleted tickers in all Subscription
deleteTicker = () => {
	Ticker.find({}, function(err, tickers) {
		tickers.forEach((ticker) => {
			Subs.find({symbol: ticker.symbol}, function(err, sub) {
				if (sub.length === 0) {
					Ticker.findOne({symbol: ticker.symbol}).remove().exec();
				}
			});
		});
	});
}

//Delete old Price documents
deleteOldPrice = () => {
	var now = new Date();
	var intervalHours = 24*2;
	var time = now.setHours(now.getHours() - intervalHours);

	Price.find({created_at: {$lte: time}}).remove().exec();
}

module.exports = {
	getApi: getApi,
	getAllApi: getAllApi,
	getAlerts: getAlerts,
	stopWatching: stopWatching,
	getSavedTickers: getSavedTickers,
	deleteSubs: deleteSubs,
	refreshPrice: refreshPrice,
	deleteTicker: deleteTicker,
	deleteOldPrice: deleteOldPrice,
	test: test,
}
