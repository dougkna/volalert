import React, { Component } from 'react';
import { Link } from 'react-router';
import { render } from 'react-dom';
import { Alert, Form, FormGroup, FormControl, Col, ControlLabel, Checkbox, Button, HelpBlock} from 'react-bootstrap';

export default class Signup extends Component {
  constructor() {
    super();
    this.state = {
      first_name: '',
      last_name: '',
      id: '',
      slack_id: '',
      email: '',
      password: ''
    }
  }

  getValidationStateFirstName() {
    var num = 0
    const length = this.state.first_name.length;
    const special = "0123456789?`~!@#$%^&*()-_=+;:''[]{}"
    for (let i = 0; i < special.length; i++){
      if (this.state.first_name.indexOf(special[i]) < 0 && length > 1){
        num++;
      } 
      else if (this.state.first_name.indexOf(special[i]) >= 0){
        return 'error';
      }
    }
    if (num == special.length){
      return 'success';
    } 
  }

  getValidationStateLastName() {
    var num = 0
    const length = this.state.last_name.length;
    const special = "0123456789?`~!@#$%^&*()-_=+;:''[]{}"
    for (let i = 0; i < special.length; i++){
      if (this.state.last_name.indexOf(special[i]) < 0 && length > 1){
        num++;
      } 
      else if (this.state.last_name.indexOf(special[i]) >= 0){
        return 'error';
      }
    }
    if (num == special.length){
      return 'success';
    } 
  }

  getValidationStateId() {
  	const length = this.state.id.length;
  	if (length === 0) return 'error'

    var id = this.state.id;
    var requirement = new RegExp('[A-Z,~!@#$%^&*()+=\\\\/"\'?<>`}{\\][\\|]')
    if (!requirement.test(id)) return 'success';
    else return 'error';  	
  }

  //SLACK Usernames must be all lowercase, with no spaces. They can only contain letters, numbers, periods, hyphens, and underscores.
  getValidationStateSlack() {
  	const length = this.state.slack_id.length;
  	if (length === 0) return 'error'

    var id = this.state.slack_id;
    var requirement = new RegExp('[A-Z,~!@#$%^&*()+=\\\\/"\'?<>`}{\\][\\|]')
    if (!requirement.test(id)) return 'success';
    else return 'error';
  }

  getValidationStateEmail() {
    if (this.state.email.length == 0) return 'warning';
    if (this.state.email.indexOf('@') <= 0 || this.state.email.indexOf('@') > this.state.email.length - 2 ){
      return 'error';
    } 
    if (this.state.email.indexOf('@') > 0 &&  this.state.email.indexOf('@') < this.state.email.length - 1){
      return 'success' 
    } 
  }

  getValidationStatePassword() {
    if (this.state.password.length >= 4) return 'success'; 
    else if (this.state.password.length == 0) return 'warning';
    else return 'error'
  }

  handleChange = (e) => {
      this.setState({ [e.target.name] : e.target.value });
  }

  _handleSubmit = (e) => {
    e.preventDefault()
    console.log(this.state)
    jQuery.ajax({
        method: "POST",
        url: '/account_signup',
        data: this.state,
        success: () => {
          console.log("return home now")
          window.location.replace("/")
        }
    });
  }

  render() {
    return (
      <Form horizontal method="post" onSubmit={this._handleSubmit}>
        
        <Col>
          <Alert style={{borderRadius: 0}} bsStyle="info" bsSize="xsmall">Please fill all information below.</Alert>
        </Col>
        
        <FormGroup
          controlId="formBasicText"
          validationState={this.getValidationStateFirstName()}
        >
        <Col componentClass={ControlLabel} sm={2}>
        First Name
        </Col>
        <Col sm={4}>
          <FormControl
            type="text"
            value={this.state.first_name}
            placeholder="Enter First Name"
            onChange={this.handleChange}
            name="first_name"
          />
          <FormControl.Feedback />
        </Col>
        </FormGroup>

        <FormGroup
          controlId="formBasicText"
          validationState={this.getValidationStateLastName()}
        >
        <Col componentClass={ControlLabel} sm={2}>
        Last Name
        </Col>
        <Col sm={4}>
          <FormControl
            type="text"
            value={this.state.last_name}
            placeholder="Enter Last Name"
            onChange={this.handleChange}
            name="last_name"
          />
          <FormControl.Feedback />
        </Col>
        </FormGroup>

        <FormGroup controlId="formHorizontalId" validationState={this.getValidationStateId()}>
          <Col componentClass={ControlLabel} sm={2}>
            ID
          </Col>
          <Col sm={4}>
            <FormControl type="text" value={this.state.id} placeholder="Create ID" name="id" onChange={this.handleChange}/>
            <FormControl.Feedback/>
          </Col>
        </FormGroup>

        <FormGroup controlId="formHorizontalSlack" validationState={this.getValidationStateSlack()}>
          <Col componentClass={ControlLabel} sm={2}>
            Slack ID
          </Col>
          <Col sm={4}>
            <FormControl type="text" value={this.state.slack_id} placeholder="Enter Slack ID" name="slack_id" onChange={this.handleChange}/>
            <FormControl.Feedback/>
          </Col>
        </FormGroup>

        <FormGroup controlId="formHorizontalEmail" validationState={this.getValidationStateEmail()}>
          <Col componentClass={ControlLabel} sm={2}>
            Email
          </Col>
          <Col sm={4}>
            <FormControl type="email" value={this.state.email} placeholder="Enter Email" name="email" onChange={this.handleChange}/>
            <FormControl.Feedback/>
          </Col>
        </FormGroup>

        <FormGroup controlId="formHorizontalPassword" validationState={this.getValidationStatePassword()}>
          <Col componentClass={ControlLabel} sm={2}>
            Password
          </Col>
          <Col sm={4}>
            <FormControl value={this.state.password} type="password" placeholder="Enter Password (min 4 char)" name="password" onChange={this.handleChange}/>
            <FormControl.Feedback/>
          </Col>
        </FormGroup>

        <FormGroup>
          <Col smOffset={2} sm={4}>
            <Button bsStyle='primary' type="submit">
              Sign Up
            </Button>
          </Col>
        </FormGroup>

      </Form>
    );
  }
}

