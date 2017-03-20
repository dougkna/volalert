'use strict';

var fs = require('fs');
var path = require('path');

var mongoose = require('mongoose');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

var compress = require('compression');
var layouts = require('express-ejs-layouts');

app.set('layout');
app.set('view engine', 'ejs');
app.set('view options', {layout: 'layout'});
app.set('views', path.join(process.cwd(), '/server/views'));

app.use(compress());
app.use(layouts);
app.use('/client', express.static(path.join(process.cwd(), '/client')));

app.disable('x-powered-by');

var env = {
  production: process.env.NODE_ENV === 'production'
};

var mongoUri = 'mongodb://localhost/db_volalert';
if (env.production) {
  Object.assign(env, {
    assets: JSON.parse(fs.readFileSync(path.join(process.cwd(), 'assets.json')))
  });
  mongoUri = process.env.MONGODB_URI;
}


var tickerArray;

console.log("Loading tickers. . .");
fs.readFile(path.join(process.cwd(), '/server/StockSymbolList.csv'), 'utf8', function (err,fullList) {
  if (err) {
    return console.log("ERROR in loading ticker list", err);
  }
  tickerArray = fullList.split('\n');
});

mongoose.connect(mongoUri, { config: { autoIndex: true } });
var auth = require('./routes/auth')
var api = require('./routes/api')

function startAutoApiCalls(){
  console.log("Start Universal Clock.")
  api.getAllApi();
  
  setInterval(function(){
    api.getAllApi();
  }, 1000*60*1) //1000*60*1 set to one minute (Stock price refresh interval)
}

setInterval(function(){
  console.log("Clean up Ticker Model")
  api.deleteTicker();
}, 1000*60*10) //1000*60*10 set to ten minutes (Ticker Model optimization interval)

setInterval(function(){
  console.log("Delete old prices")
  api.deleteOldPrice();
}, 1000*60*60*24*2) //one week (Will store only one week's worth of historical prices)

startAutoApiCalls();

app.get('/watch', api.getApi)

app.get('/checkTicker', function(req, res){
  var reqTicker = req.query.input;
  var verifiedTicker = "Nothing Found"
  for (var i = 0 ; i < tickerArray.length ; i++){
    //how to take care of situations like AAPL accepting "aa"?
    if (tickerArray[i].indexOf(reqTicker.toUpperCase()) >= 0){
      verifiedTicker = tickerArray[i];
      console.log("NAME ::", verifiedTicker);
      res.send(verifiedTicker);
      return;
    } 
  }
  res.send(verifiedTicker)
})

app.get('/user', auth.getUser);
app.get('/alerts', api.getAlerts);
app.get('/getSavedTickers', api.getSavedTickers);
app.post('/account_signup', auth.signup);
app.post('/handle_login', auth.login);
app.post('/stopWatching', api.stopWatching);
app.post('/deleteSubs', api.deleteSubs);
app.get('/refreshPrice', api.refreshPrice);



app.get('/*', function(req, res) {
  res.render('index', {
    env: env
  });
});

var port = Number(process.env.PORT || 3001);
app.listen(port, function () {
  console.log('server running at localhost:3001');
});

if (env.production === false) {
  var webpack = require('webpack');
  var WebpackDevServer = require('webpack-dev-server');

  var webpackDevConfig = require('./webpack.config.development');

  new WebpackDevServer(webpack(webpackDevConfig), {
    publicPath: '/client/',
    contentBase: './client/',
    inline: true,
    hot: true,
    stats: false,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3001',
      'Access-Control-Allow-Headers': 'X-Requested-With'
    }
  }).listen(3000, 'localhost', function (err) {
    if (err) {
      console.log(err);
    }

    console.log('webpack dev server listening on localhost:3000');
  });
}
