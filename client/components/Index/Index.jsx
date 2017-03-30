import React, { Component } from 'react';
import { Alert, Collapse, DropdownButton, MenuItem, Col, Row, Button, Form, FormGroup, FormControl } from 'react-bootstrap';
import Navigator from 'components/Navigator'

export default class Ticker extends Component {
  constructor(){
    super();
    this.state = {
      tickers : [],
      text : '',
      price : '',
      index : 'Index',
      watchingTickers : {},
      short_symbol : '',
      volPercent : 0.5,
      loggedIn : false,
      user_id : '',
      watchSwitch : false,
    }
  }

  approveLogin = () => {
    this.setState({ loggedIn: true });
    this.getUserInfo();
  };

  getToken = (token) => {
    this.setState({ token });
  };

  getName = (first_name) => {
    this.setState({ first_name });
  };

  getUserId = (user_id) => {
    this.setState({ user_id });
  };

  deleteToken = (e) => {
    if (e.target.name == 'signoff'){
      delete localStorage.token;
      console.log("DELETING TOKEN")
      this.setState({ loggedIn : false, watchSwitch : false});
      this.setState({ tickers : [] })
    }
  }

  componentWillMount(){
    if (localStorage.token){
      console.log("loggedIn is now true")
      this.setState({ loggedIn : true });
      this.getUserInfo();
    }
  }

  getUserInfo(){
    jQuery.ajax({
      method: "GET",
      url: '/user',
      data: { token : localStorage.token },
      success: (result) => {
        this.setState({ first_name : result.first_name, user_id : result.id })
        console.log(`current user id :: ${result.id}`)
        this.pollAlerts(result.id);
        this.getSavedTickers(result.id);
      }
    });
  }

  pollAlerts = (user_id) => {
    this.alertPoll = setInterval(() => {
      jQuery.ajax({
        method: "GET",
        url: '/alerts',
        data: { user_id },
        success: (results) => {
          var array = results.map((result) => {
           return `${result.name} (Price: ${result.price}) => Price changed by ${result.volatility}%!\r`
          })
          console.log(array)
          alert(array)
        }
      });
    }, 30000);
  }

  getSavedTickers = (user_id) => {
    jQuery.ajax({
      method: "GET",
      url: '/getSavedTickers',
      data: { user_id },
      success: (result) => {
        console.log("saved :", result)
        
        for (var i = 0 ; i < result.length ; i++){
          var newTicker = {
            name: result[i]['name'],
            symbol: result[i]['symbol'],
            short_symbol: result[i]['symbol'].split(':')[1].trim(),
            id: Date.now(),
            volPercent: result[i]['percent_setting']
          };
          this.setState((prevState) => ({
            tickers: prevState.tickers.concat(newTicker),
            text: '',
            volPercent: 0.5
          }));
        }
      }
    });
  }

  componentWillUnmount(){
    clearInterval(this.alertPoll);
    clearInterval(this.priceRef);
  }

  pickPercent(e, item) {
    console.log("item", item)
    console.log("change percent to : ", e.target.value)
    let tickers = this.state.tickers.slice(0);
    tickers.filter((pickedItem) => {
      if (pickedItem.id === item.id){
        pickedItem['volPercent'] = parseFloat(e.target.value);
      }
    })
    this.setState({ tickers: tickers });
  }

  stopWatching(e) {
    e.preventDefault();
    jQuery.ajax({
      method: "POST",
      url: '/stopWatching',
      data: { input: this.state.user_id },
      success: (result) => {
        this.setState({watchSwitch: !this.state.watchSwitch})
      }
    });
  }

  startWatching(e) {
    if (!this.state.loggedIn) {
      alert("Please sign in first.");
      return;
    }

    e.preventDefault();
    jQuery.ajax({
      method: "GET",
      url: '/watch',
      data: { input: this.state },
      success: (result) => {
        this.setState({ watchingTickers : result })
        let tickers = this.state.tickers.slice(0);
        for (var i = 0 ; i < Object.keys(result).length ; i++){
          if (tickers[i]['short_symbol'] === this.state.watchingTickers[i]['t']){
            tickers[i]['price'] = this.state.watchingTickers[i]['l_fix']
          } else {
            console.log("Something went wrong when retrieving price.")
            tickers[i]['price'] = 'ERROR'
          }
        }
        this.setState({ tickers: tickers, watchSwitch: !this.state.watchSwitch });
        console.log("CHANGED TICKER STATE ", tickers)
      }
    })
    this.refreshPrice();
  }

  refreshPrice = () => {
    this.priceRef = setInterval(() => {
      jQuery.ajax({
        method: "GET",
        url: '/refreshPrice',
        data: { user_id: this.state.user_id },
        success: (arr) => {
          let tickers = this.state.tickers.slice(0);
          for (var i = 0 ; i < tickers.length ; i++){
            for (var j = 0 ; j < arr.length; j++){
              if (tickers[i]['symbol'] === arr[j]['symbol']){
                tickers[i]['price'] = arr[j]['price'];
              }
            }
          }
          this.setState({ tickers: tickers })
        }
      });
    }, 30000);
  }

  checkTickerBeforeAdd(e){
    e.preventDefault();
    if (this.state.tickers.length <= 4) {
      jQuery.ajax({
        method: "GET",
        url: '/checkTicker',
        data: {input : `${this.state.index}:${this.state.text}`},
        success: (result) => {
          if (result !== "Nothing Found"){
            var validAdd = result.split(",");
            var compName = validAdd[0];
            var compSymbol = validAdd[1].trim();
            for (var i = 0 ; i < this.state.tickers.length ; i++){
              if (this.state.tickers[i].symbol === compSymbol){
                alert("Ticker already exists in the list.");
                return;
              }
            }
            this.handleTickerSubmit(compName, compSymbol)
          } else {
            alert("Ticker does not exist.")
          }
        }
      })
    } else {
      alert("Max 5 tickers are permitted.")
    }
  }

  handleTickerSubmit(name, symbol){
    var short_symbol = symbol.split(':')[1].toUpperCase().toString().trim();
    var newTicker = {
      //text: `${this.state.index}:${this.state.text}`,
      name: name,
      symbol: symbol,
      short_symbol: short_symbol,
      id: Date.now(),
      volPercent: this.state.volPercent
    };
    this.setState((prevState) => ({
      tickers: prevState.tickers.concat(newTicker),
      text: '',
      volPercent: 0.5
    }));
  }

  handleDropdown(event){
    this.setState({index : event})
  }

  handleRemove(item){
    jQuery.ajax({
      method: "POST",
      url: '/deleteSubs',
      data: {user_id: this.state.user_id, symbol: item.symbol},
      success: (result) => {
        console.log("Success in deletion.", result)
      }
    })

    var newTickers = this.state.tickers.filter((pickedItem) => {
      return pickedItem.id !== item.id
    })
    this.setState({ tickers : newTickers })
  }

  typeTicker(e){
    this.setState({text: e.target.value});
  }

  test(e){
    console.log("watchSwitch", this.state.watchSwitch) //<button onClick={(e) => this.test(e)}>test</button>
  }

  render() {
    const { loggedIn, open } = this.state;
    return (
      <div className='container-master'>
        <Navigator loggedIn={loggedIn} approveLogin={this.approveLogin} getToken={this.getToken}
          getUserId={this.getUserId} getName={this.getName} deleteToken={this.deleteToken}
        />
        
        <Form inline className='input-x' onSubmit={this.checkTickerBeforeAdd.bind(this)}>
          <FormGroup bsSize="small">
            <div className='body-x'>
              {!open && !loggedIn && "Please log in or sign up."} &emsp;
              {loggedIn && <p> Signed in : {this.state.first_name}</p>}
              <a href="https://slack.com/oauth/authorize?scope=incoming-webhook,commands,bot&client_id=73617271569.161991081159"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>
            </div>
            <Col>
              <DropdownButton 
                className='index-button' title={this.state.index} 
                id="bg-nested-dropdown" 
                onSelect={(event) => this.handleDropdown(event)}
              >
                <MenuItem eventKey="KRX">KRX (&#8361;)</MenuItem>
                <MenuItem eventKey="KOSDAQ">KOSDAQ (&#8361;)</MenuItem>
                <MenuItem eventKey="NYSE">NYSE</MenuItem>
                <MenuItem eventKey="NASDAQ">NASDAQ</MenuItem>
              </DropdownButton>
              <FormControl name="search" className="search-bar" type="text" placeholder="Type Ticker" 
                onChange={this.typeTicker.bind(this)} value={this.state.text}
              />
              <Button className='add-button' type="submit" 
                disabled={!this.state.text.trim() || this.state.index=="Index"}
              >
                ADD
              </Button>
            </Col>
            <TickerList handleRemove={this.handleRemove.bind(this)} tickers={this.state.tickers} 
              watchingTickers={this.state.watchingTickers} startWatching={this.startWatching.bind(this)} 
              stopWatching={this.stopWatching.bind(this)} pickPercent={this.pickPercent.bind(this)}
              watchSwitch={this.state.watchSwitch}
            />
          </FormGroup>
        </Form>
      </div>
    )
  }
}

class TickerList extends Component {
  render() {
    return(
        <ul className='ul-input-bar'>
          {this.props.tickers.map(ticker => (
            <div>
              <p className='list-input-bar' key={ticker.id}>
                <span>{ticker.symbol}&emsp;</span>{ticker.name}&emsp;&emsp;
                <span>{ticker.price}</span>
                {this.props.watchSwitch && <span className='loading'></span>}
              <button type="button" className="close" aria-label="Close" 
                onClick={this.props.handleRemove.bind(this, ticker)}
              >
                <span aria-hidden="true">&times;</span>
              </button>
              <select class="selectpicker" style={{float:"right", marginRight:"4px"}} 
                value={ticker.volPercent} onChange={(e) => this.props.pickPercent(e, ticker)}
              >
                <option value={0.5}>0.5%</option>
                <option value={1}>1%</option>
                <option value={2}>2%</option>
                <option value={3}>3%</option>
                <option value={4}>4%</option>
                <option value={5}>5%</option>
                <option value={10}>10%</option>
              </select>
              </p>
            </div>
          ))}
          {!this.props.watchSwitch && this.props.tickers.length > 0 && 
            <Button className="watch-button" block onClick={this.props.startWatching}> Save & Start Watching
            </Button>
          }
          {this.props.watchSwitch && this.props.tickers.length > 0 && 
            <Button className="watch-button" block onClick={this.props.stopWatching}> Stop Watching All
            </Button>
          }
        </ul>
    )
  }
}


