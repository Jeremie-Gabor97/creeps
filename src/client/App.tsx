import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import * as io from 'socket.io-client';

import LobbyScreen from './LobbyScreen';
import MainScreen from './MainScreen';

import './App.css';

enum ScreenType {
	Main,
	Lobby
}

@observer
class App extends React.Component<{}> {
	@observable activeScreen: ScreenType = ScreenType.Main;
	socket: SocketIOClient.Socket;

	constructor(props: {}) {
		super(props);
		this.socket = io();
	}

	handleLogin = () => {
		this.activeScreen = ScreenType.Lobby;
	}

	renderScreen() {
		switch (this.activeScreen) {
			case ScreenType.Main:
				return <MainScreen key={'main'} onLogin={this.handleLogin} />;
			case ScreenType.Lobby:
				return <LobbyScreen key={'lobby'} />;
			default:
				return null;
		}
	}

	public render() {
		return (
			<div className="App">
				<div className="App-screen">
					<ReactCSSTransitionGroup
						transitionName={'swag'}
						transitionEnterTimeout={1000}
						transitionLeaveTimeout={1000}
					>
						{this.renderScreen()}
					</ReactCSSTransitionGroup>
				</div>
			</div>
		);
	}
}

export default App;
