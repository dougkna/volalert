import React, { Component } from 'react';
import { render } from 'react-dom';
import { browserHistory, Router, Route, Link, withRouter } from 'react-router'

import { Form, FormGroup, FormControl, Col, ControlLabel, Checkbox, Button, Alert, Collapse, Badge} from 'react-bootstrap';
//import auth from 'containers/auth'

export default class Login extends Component{
	
	constructor() {
		super();
		this.state = {
			email : '',
			password : '',
			error : false
		}
	}

	_handleSubmit = (e) => {
		e.preventDefault()
		const email = this.state.email;
		const password = this.state.password;
		this.login(email, password)
	}

	login(email, password) {
		if (!localStorage.token) {	
			this.sendRequest(email, password, (res) => {
				if (res.authenticated) {
					localStorage.token = res.token;
					//saveToken(res.token);
					this.props.getToken(res.token);
					this.props.getUserId(res.user_id);
					this.props.getName(res.first_name);
					console.log(`token is : ${localStorage.token}`)
					this.props.approveLogin();
				}
			})
		} else {
			console.log('localStorage is taken')
		}
	}

	componentWillMount() {
		this.render();
	}

	sendRequest(email, password, cb) {
		setTimeout(() => {
			jQuery.ajax({
				method: "POST",
				url: '/handle_login',
				data: this.state,
				success: (result) => {
					console.log("from BACKEND: "+result)
					if (result.success) {
						console.log("SUCCESS");
						cb({
							authenticated: true,
							token: result.token,
							first_name: result.first_name,
							user_id: result.user_id,
						})
						this.setState({ error : false });
					} else {
						console.log("FAILED LOGIN");
						cb({ authenticated: false });
						this.setState({ error : true });
					}
				}
			});
		}, 0);
	}

	handleChange = (e) => {
		this.setState({[e.target.name] : e.target.value});
	}

	render() {
		return (
		  <Form horizontal onSubmit={this._handleSubmit}>
		    <FormGroup controlId="formHorizontalEmail">
		      <Col componentClass={ControlLabel}>
		        Email
		      </Col>
		      <Col sm={12}>
		        <FormControl type="email" value={this.state.email} placeholder="Email" name="email" onChange={this.handleChange}/>
		      </Col>
		    </FormGroup>

		    <FormGroup controlId="formHorizontalPassword">
		      <Col componentClass={ControlLabel}>
		        Password
		      </Col>
		      <Col sm={12}>
		        <FormControl type="password" value={this.state.password} placeholder="Password" name="password" onChange={this.handleChange}/>
		      </Col>
		    </FormGroup>
		    {this.state.error && (
        		<Col><Badge>Wrong email or password.</Badge></Col>
      		)}

		    <FormGroup>
		      <Col sm={12}>
		        <Checkbox>Remember me</Checkbox>
		      </Col>
		    </FormGroup>

		    <FormGroup>
		      <Col sm={12}>
		        <Button style={{width:"100%"}} bsStyle='primary' type="submit">
		          Sign In
		        </Button>
		      </Col>
		    </FormGroup>
		  </Form>
	  	)
	}
}

// var mountNode = document.getElementById('loginForm');

// render(<FormInstance />, mountNode);
