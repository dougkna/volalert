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
      volPercent : 1,
      loggedIn : false,
      user_id : "na"
    }
  }

  approveLogin = () => {
    this.setState({ loggedIn: true });
  };

  getToken = (token) => {
    this.setState({ token : token })
  };

  getName = (first_name) => {
    this.setState({ first_name : first_name})
  };

  deleteToken = (e) => {
    if (e.target.name == 'signoff'){
      delete localStorage.token;
      console.log("DELETING TOKEN")
      this.setState({ loggedIn : false})
    }
  }

  componentWillMount(){
    if (localStorage.token){
      console.log("loggedIn is now true")
      this.setState({ loggedIn : true })

      jQuery.ajax({
        method: "GET",
        url: '/user',
        data: { token : localStorage.token },
        success: (result) => {
          this.setState({ first_name : result.first_name, user_id : result.id })
          console.log(`current result :: ${JSON.stringify(result)}`)
          console.log(`current user id :: ${result.id}`)
        }
      });
    }
  }

  pickPercent(e, item) {
    console.log("item", item)
    console.log("change percent to : ", e.target.value)
    let tickers = this.state.tickers.slice(0);
    tickers.filter((pickedItem) => {
      if (pickedItem.id === item.id){
        pickedItem['volPercent'] = parseInt(e.target.value);
      }
    })
    this.setState({ tickers: tickers });
    console.log('CHANGED STATE AFTER PERC ', this.state)
  }

  stopWatching(e) {
    e.preventDefault();
  }

  startWatching(e) {
    console.log("TICKERRRR", this.state.tickers)
    e.preventDefault();
    jQuery.ajax({
      method: "GET",
      url: '/watch',
      data: { input : this.state },
      success: (result) => {
        this.setState({ watchingTickers : result })
        let tickers = this.state.tickers.slice(0);
        for (var i = 0 ; i < Object.keys(result).length ; i++){
          if (tickers[i]['short_symbol'] === this.state.watchingTickers[i]['t']){
            tickers[i]['price'] = this.state.watchingTickers[i]['l']
          } else {
            console.log("Something went wrong when retrieving price.")
            tickers[i]['price'] = 'ERROR'
          }
        }
        this.setState({ tickers: tickers });
        console.log("CHANGED TICKER STATE ", tickers)
      }
    })
  }

  checkTickerBeforeAdd(e){
    e.preventDefault();
    jQuery.ajax({
      method: "GET",
      url: '/checkTicker',
      data: {input : `${this.state.index}:${this.state.text}`},
      success: (result) => {
        console.log("RESULTTT ::: ", result);
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
          console.log("compSymbol", compSymbol)
          this.handleTickerSubmit(compName, compSymbol)
        } else {
          alert("Ticker does not exist.")
        }
      }
    })
  }

  handleTickerSubmit(name, symbol){
    console.log("SUMBIT ", this.state)
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
      volPercent: 1
    }));
  }

  handleDropdown(event){
    this.setState({index : event})
  }

  handleRemove(item){
    var newTickers = this.state.tickers.filter((pickedItem) => {
      return pickedItem.id !== item.id
    })
    this.setState({ tickers : newTickers })
  }

  typeTicker(e){
    this.setState({text: e.target.value});
  }

  test(e){
    console.log("volPercentTTTTT", this.state.volPercent)
  }

  render() {
    const { loggedIn, open } = this.state;
    console.log("TICKERS WATCHING", this.state.watchingTickers.length)
    return (
      <div className='container-master'>
        <Navigator loggedIn={loggedIn} approveLogin={this.approveLogin} getToken={this.getToken} getName={this.getName} deleteToken={this.deleteToken}/>
        
        
        <Form inline className='input-x' onSubmit={this.checkTickerBeforeAdd.bind(this)}>
          <FormGroup bsSize="small">
            <div className='body-x'>
              {!open && !loggedIn && "Please log in or sign up."} &emsp;
              {loggedIn && <p> Trader signed in : {this.state.first_name}</p>}
            </div>
            <Col>
              <DropdownButton className='index-button' title={this.state.index} id="bg-nested-dropdown" onSelect={(event) => this.handleDropdown(event)}>
                <MenuItem eventKey="KRX">KRX (&#8361;)</MenuItem>
                <MenuItem eventKey="KOSDAQ">KOSDAQ (&#8361;)</MenuItem>
                <MenuItem eventKey="NYSE">NYSE</MenuItem>
                <MenuItem eventKey="NASDAQ">NASDAQ</MenuItem>
              </DropdownButton>
              <FormControl name="search" className="search-bar" type="text" placeholder="Type Ticker" onChange={this.typeTicker.bind(this)} value={this.state.text}/>
              <Button className='add-button' type="submit" disabled={!this.state.text.trim() || this.state.index=="Index"}>ADD</Button>
            </Col>
            <TickerList handleRemove={this.handleRemove.bind(this)} tickers={this.state.tickers} 
              watchingTickers={this.state.watchingTickers} startWatching={this.startWatching.bind(this)} 
              stopWatching={this.stopWatching} pickPercent={this.pickPercent.bind(this)}
            />
          </FormGroup>
        </Form>
        <button onClick={(e) => this.test(e)}>test</button>
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
              <p className='list-input-bar' key={ticker.id}><span>{ticker.symbol}&emsp;</span>{ticker.name}&emsp;&emsp; <span className="text-success">{ticker.price}</span>
              <button type="button" className="close" aria-label="Close" onClick={this.props.handleRemove.bind(this, ticker)}><span aria-hidden="true">&times;</span></button>
              <select class="selectpicker" style={{float:"right", marginRight:"4px"}} onChange={(e) => this.props.pickPercent(e, ticker)}>
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
          {!this.props.watchingTickers.length && this.props.tickers.length > 0 && <Button className="watch-button" block onClick={this.props.startWatching}> Start Watching </Button>}
          {this.props.watchingTickers.length && this.props.tickers.length > 0 && <Button className="watch-button" block onClick={this.props.stopWatching}> Stop Watching </Button>}
        </ul>
    )
  }
}


