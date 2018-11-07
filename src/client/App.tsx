import { extendObservable } from 'mobx';
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

class App extends React.Component<{}> {
	activeScreen: ScreenType;
	socket: SocketIOClient.Socket;

	constructor(props: {}) {
		super(props);
		this.socket = io('http://localhost:5000');
		extendObservable(this, {
			activeScreen: ScreenType.Main
		});
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
				{/*<CSSTransition
					in={true}
					classNames={'App-MainScreen'}
					timeout={1000}
					onEntered={() => {
						console.log('entered');
					}}
				>
					<MainScreen onLogin={this.handleLogin}/>
				</CSSTransition>
				<CSSTransition
					in={false}
					classNames={'App-LobbyScreen'}
					timeout={1000}
				>
					<LobbyScreen />
				</CSSTransition>*/}
			</div>
		);
	}
}

export default observer(App);
