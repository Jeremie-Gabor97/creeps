import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import * as SocketContract from '../shared/socketcontract';
import { SocketEvent } from '../shared/socketcontract';
import { ScreenType } from './app';

import './lobbyscreen.css';

export interface ILobbyScreenProps {
	socket: SocketIOClient.Socket;
	switchScreen: (type: ScreenType) => void;
}

@observer
class LobbyScreen extends React.Component<ILobbyScreenProps> {
	usernameInput: HTMLInputElement | null;
	@observable selectedTab: 'lobby' | 'progress' = 'lobby';
	@observable joinFailed: boolean = false;

	componentDidMount() {
		this.attachSocketListeners();
	}

	componentWillUnmount() {
		this.removeSocketListeners();
	}

	attachSocketListeners() {
		this.props.socket.on(SocketEvent.JoinFailed, this.onJoinFailed);
		this.props.socket.on(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
	}

	removeSocketListeners() {
		this.props.socket.removeEventListener(SocketEvent.JoinFailed, this.onJoinFailed);
		this.props.socket.removeEventListener(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
	}

	onJoinFailed = (data: SocketContract.IJoinFailedData) => {
		this.joinFailed = true;
	}

	onLobbyUpdate = (data: SocketContract.ILobbyUpdateData) => {
		console.log('got lobby update data');
	}

	onClickHeaderLobby = () => {
		this.selectedTab = 'lobby';
	}

	onClickHeaderProgress = () => {
		this.selectedTab = 'progress';
	}

	public render() {
		return (
			<div className={'LobbyScreen'}>
				<div className={'LobbyScreen-header'}>
					<img src={''} className={'LobbyScreen-header-avatar'} />
					<span className={'LobbyScreen-header-username'}>
						{'Username'}
					</span>
				</div>
				<div className={'LobbyScreen-gameList-header'}>
					<div className={'LobbyScreen-gameList-header-entry'} onClick={this.onClickHeaderLobby}>
						{'Lobby' + '(0)'}
					</div>
					<div className={'LobbyScreen-gameList-header-entry'} onClick={this.onClickHeaderProgress}>
						{'In Progress' + '(0)'}
					</div>
				</div>
				<div className={'LobbyScreen-gameList-body'}>
					{this.selectedTab === 'lobby'
						? (
							<div className={'LobbyScreen-gameList-body-lobby'}>
								{'Lobby games'}
							</div>
						)
						: (
							<div className={'LobbyScreen-gameList-body-progress'}>
								{'In progress games'}
							</div>
						)
					}
				</div>
				{this.joinFailed && (
					<div className={'LobbyScreen-joinFailed'}>
						{'Oh no the join failed!'}
					</div>
				)}
			</div>
		);
	}
}

export default LobbyScreen;
