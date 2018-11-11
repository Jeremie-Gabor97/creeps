import classNames from 'classnames';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import * as SocketContract from '../shared/socketcontract';
import { SocketEvent } from '../shared/socketcontract';
import { updateGameLobby, updateLobby } from './actions';
import { ScreenType } from './app';
import { gameLobbyStore } from './stores';

import './gamelobbyscreen.css';

export interface IGameLobbyScreenProps {
	socket: SocketIOClient.Socket;
	switchScreen: (type: ScreenType) => void;
}

@observer
class GameLobbyScreen extends React.Component<IGameLobbyScreenProps> {

	componentDidMount() {
		this.attachSocketListeners();
	}

	componentWillUnmount() {
		this.removeSocketListeners();
	}

	attachSocketListeners() {
		this.props.socket.on(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
		this.props.socket.on(SocketEvent.GameLobbyUpdate, this.onGameLobbyUpdate);
	}

	removeSocketListeners() {
		this.props.socket.removeEventListener(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
		this.props.socket.removeEventListener(SocketEvent.GameLobbyUpdate, this.onGameLobbyUpdate);
	}

	onLobbyUpdate = (data: SocketContract.ILobbyUpdateData) => {
		updateLobby(data);
		this.props.switchScreen(ScreenType.Lobby);
	}

	onGameLobbyUpdate = (data: SocketContract.IGameLobbyUpdateData) => {
		updateGameLobby(data);
	}

	onClickLeave = () => {
		this.props.socket.emit(SocketEvent.LeaveGameLobby);
	}

	public render() {
		return (
			<div className={'GameLobbyScreen'}>
				{'GameLobby'}
				<div className={'GameLobbyScreen-leave'} onClick={this.onClickLeave}>
					{'Leave Game'}
				</div>
				<div className={'GameLobbyScreen-players'}>
					{Object.keys(gameLobbyStore.players).map(username => {
						return (
							<div key={username}>{username}</div>
						);
					})}
				</div>
			</div >
		);
	}
}

export default GameLobbyScreen;
