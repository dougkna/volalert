'use strict';

import 'styles/main.scss';

import React from 'react';
import { render } from 'react-dom';
import { Router, Route, browserHistory } from 'react-router'
import Index from 'components/Index/Index';
import NotFound from 'components/NotFound/NotFound';

render((
  <Router history={browserHistory}>
    <Route path="/" component={Index} />	
    <Route path="*" component={NotFound} />
  </Router>
), document.getElementById('js-main'));
