/*******************************************************************************
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 *
 ********************************************************************************/
import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAws } from '@fortawesome/free-brands-svg-icons';
import { faPlusSquare, faSignOutAlt, faBars, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';

//Amplify
import Amplify, { Auth } from 'aws-amplify';
import { withAuthenticator, AmplifyTheme } from 'aws-amplify-react';
import awsConfig from './aws_config'

//Components
import Dashboard from './Components/Dashboard/Dashboard.js';
import LaunchLocust from './Components/Launch/LaunchLocust.js'
import Manage from './Components/Manage/Manage.js'
import '@aws-amplify/ui/dist/style.css';

declare var awsConfig;
Amplify.configure(awsConfig);
//Amplify.Logger.LOG_LEVEL = 'DEBUG';

const loginTheme = {
  sectionFooterSecondaryContent: {
    ...AmplifyTheme.sectionFooterSecondaryContent,
    display: "none"
  }

};

class App extends React.Component {

  constructor(props) {
    super(props);
    this.noMatch = this.noMatch.bind(this);
    this.signOut = this.signOut.bind(this);
    this.toggleNavbar = this.toggleNavbar.bind(this);
    this.state = {
      collapsed: true
    };
  }

  noMatch({ location }) {
    return (
      <div>
        <h3>
          Error 404 Page not found: <code>{location.pathname}</code>
        </h3>
      </div>
    );
  }

  toggleNavbar() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  signOut() {
    Auth.signOut();
    window.location.reload();
  }

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  render() {
    return (
      <div>
        <Router>

          <Navbar color="dark" dark fixed="top" expand="md">
            <NavbarBrand href="/"> <FontAwesomeIcon icon={faAws} size="lg" color="#FF9900" id="logo" /> Distributed Load Testing</NavbarBrand>
            <NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
            <Collapse isOpen={!this.state.collapsed} navbar>
              <Nav className="mr-auto" navbar>
                <NavItem>
                  <Link to={'/dashboard'} className="nav-link">
                    <FontAwesomeIcon id="icon" icon={faBars} /> Dashboard
              </Link>
                </NavItem>
                <NavbarToggler onClick={this.toggle} />
                <Collapse isOpen={this.state.isOpen} navbar>
                  <Nav className="ml-auto" navbar>
                    <UncontrolledDropdown nav inNavbar>
                      <DropdownToggle nav caret>
                        <FontAwesomeIcon id="icon" icon={faPlusSquare} />  Launch engine
                </DropdownToggle>
                      <DropdownMenu right>
                        <DropdownItem>
                          <Link to={{
                            pathname: "/launch/locust",
                            state: { engine_type: "locust" }
                          }}>
                            Locust
                          </Link>
                        </DropdownItem>
                      </DropdownMenu>
                    </UncontrolledDropdown>
                  </Nav>
                </Collapse>
              </Nav>
              <Nav className="ml-auto" navbar>
                <NavItem>
                  <Link to="" onClick={this.signOut} className="nav-link">
                    <FontAwesomeIcon id="icon" icon={faSignOutAlt} /> Sign Out
                  </Link>
                </NavItem>
              </Nav>
            </Collapse>
          </Navbar>

          <div className="main">
            <Switch>
              <Route path="/" exact component={Dashboard} />
              <Route path="/dashboard" exact component={Dashboard} />
              <Route path="/launch/locust" exact component={LaunchLocust} />
              <Route path="/manage/:engine" exact component={Manage} />
              <Route component={this.noMatch} />
            </Switch>
            <div className="footer">
              <p>For help please see the <a className="text-link" href="https://github.com/melbourneit-es/int-terraform-aws-loadtesting"
                target="_blank"
                rel="noopener noreferrer">
                solution home page <FontAwesomeIcon size="sm" icon={faExternalLinkAlt} />
              </a></p>
            </div>
          </div>
        </Router>

      </div>
    )
  }
}

//export default App;
export default withAuthenticator(App, false, [], null, loginTheme);
