import React, {Component} from 'react';
import { Collapse, Navbar, NavItem, MenuItem, NavDropdown, Form, FormGroup, FormControl, Row, Col, Nav, ControlLabel, Checkbox, Button, Alert, Badge, ListGroup, ListGroupItem, Table} from 'react-bootstrap';
import { Router, Route, hashHistory, Link} from 'react-router'
import Login from 'components/Login'

export default class Navigation extends Component {
	constructor(){
    	super();
    	this.state = {
    		open : false
    	}
    }

    render(){
		//const { open } = this.state;
		return(
			<Navbar className='container-x' style={{borderRadius: 0, position: "fixed", right: 0, left: 0, width: "100%"}} collapseOnSelect >
			    <Navbar.Header>
			      <Navbar.Brand>
			        <a href="/"><strong>Volalert</strong></a>
			      </Navbar.Brand>
			      <Navbar.Toggle />
			    </Navbar.Header>
			    <Navbar.Collapse>
			      <Nav>
			        <NavItem eventKey={1} href="#">Let your bot watch the market and alert you sudden moves</NavItem>
			      </Nav>
			      <Nav pullRight>
			        <li><Link to="/signup">Signup</Link></li>
			        <li>
			        	{!this.props.loggedIn && <button onClick ={ () => this.setState({open : !this.state.open })}> Login </button>}
			        	{!this.props.loggedIn && 
			        	<Collapse in={this.state.open}>
			            	<div><Login approveLogin={this.props.approveLogin} getToken={this.props.getToken} getUserId={this.props.getUserId} getName={this.props.getName}/></div>
			          	</Collapse>
			          	}
			        </li>
			        {this.props.loggedIn && <li><button name="signoff" onClick={this.props.deleteToken}>Sign Off</button></li>}

			      </Nav>
			    </Navbar.Collapse>
			</Navbar>
		)
	}
}

