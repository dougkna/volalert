import React, { Component } from 'react';
import { Alert, Form, FormGroup, FormControl, Col, Row, ControlLabel, Checkbox, Button, ButtonToolbar, Collapse, Well } from 'react-bootstrap';

export default class Ticker extends Component {
  constructor(){
    super();
    this.state = {
      tickers : [],
      text : ''
    }
  }

  handleTickerSubmit(e){
    e.preventDefault()
    console.log("SUMBIT ", this.state)
    var newTicker = {
      text: this.state.text,
      id: Date.now()
    };
    this.setState((prevState) => ({
      tickers: prevState.tickers.concat(newTicker),
      text: ''
    }));
  }

  handleRemove(item){
    console.log(item)
    console.log(this.state)
    var newTickers = this.state.tickers.filter((pickedItem) => {
      return pickedItem.id !== item.id
    })
    this.setState({ tickers : newTickers })
  }

  typeTicker(e){
    this.setState({text: e.target.value});
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleTickerSubmit.bind(this)}>
          <FormGroup bsSize="small">
            <Col sm={3}>
              <FormControl className='input-bar' name="search" type="text" placeholder="Type Ticker" onChange={this.typeTicker.bind(this)} value={this.state.text}/>
              <Button className='add-button' type="submit">ADD</Button>
            </Col>
            <TickerList handleRemove={this.handleRemove.bind(this)} tickers={this.state.tickers}/>
          </FormGroup>
        </form>
      </div>
    )
  }
}

class TickerList extends Component {


  render() {
    return(
        <ul className='ul-input-bar'>
          {this.props.tickers.map(ticker => (
              <p className='list-input-bar' key={ticker.id}>{ticker.text}&ensp;
              <Button className='delete-button' onClick={this.props.handleRemove.bind(this, ticker)}>X</Button>
              </p>
          ))}
        </ul>
    )
  }
}


