import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import * as io from 'socket.io-client';

import * as SocketContract from '../shared/socketcontract';
import LobbyScreen from './lobbyscreen';
import MainScreen from './mainscreen';

import './App.css';

export enum ScreenType {
	Main,
	Lobby
}

@observer
class App extends React.Component<{}> {
	@observable disconnected: boolean = false;
	@observable activeScreen: ScreenType = ScreenType.Main;
	socket: SocketIOClient.Socket;

	constructor(props: {}) {
		super(props);
		this.socket = io();

		this.socket.on('disconnect', () => {
			this.disconnected = true;
		});
	}

	switchScreen = (type: ScreenType) => {
		this.activeScreen = type;
	}

	renderScreen() {
		switch (this.activeScreen) {
			case ScreenType.Main:
				return <MainScreen key={'main'} socket={this.socket} switchScreen={this.switchScreen} />;
			case ScreenType.Lobby:
				return <LobbyScreen key={'lobby'} socket={this.socket} switchScreen={this.switchScreen} />;
			default:
				return null;
		}
	}

	public render() {
		return (
			<div className={'App'}>
				<div className={'App-screen'}>
					{this.disconnected
						? (
							<div className={'App-disconnected'}>
								{'Disconnected from the server'}
							</div>
						)
						: (
							<ReactCSSTransitionGroup
								transitionName={'swag'}
								transitionEnterTimeout={1000}
								transitionLeaveTimeout={1000}
							>
								{this.renderScreen()}
							</ReactCSSTransitionGroup>
						)
					}
				</div>
			</div >
		);
	}
}

export default App;
