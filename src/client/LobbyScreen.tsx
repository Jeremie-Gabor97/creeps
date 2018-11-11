import classNames from 'classnames';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import * as SocketContract from '../shared/socketcontract';
import { SocketEvent } from '../shared/socketcontract';
import { changeAvatar, updateGameLobby, updateLobby } from './actions';
import { ScreenType } from './app';
import RootStore, { lobbyStore } from './stores';

import './lobbyscreen.css';

export interface ILobbyScreenProps {
	socket: SocketIOClient.Socket;
	switchScreen: (type: ScreenType) => void;
}

@observer
class LobbyScreen extends React.Component<ILobbyScreenProps> {
	usernameInput: HTMLInputElement | null;
	@observable selectedTab: 'lobby' | 'progress' | 'create' = 'lobby';
	@observable joinFailed: string = '';

	componentDidMount() {
		this.attachSocketListeners();
	}

	componentWillUnmount() {
		this.removeSocketListeners();
	}

	attachSocketListeners() {
		this.props.socket.on(SocketEvent.JoinFailed, this.onJoinFailed);
		this.props.socket.on(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
		this.props.socket.on(SocketEvent.GameLobbyUpdate, this.onGameLobbyUpdate);
	}

	removeSocketListeners() {
		this.props.socket.removeEventListener(SocketEvent.JoinFailed, this.onJoinFailed);
		this.props.socket.removeEventListener(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
		this.props.socket.removeEventListener(SocketEvent.GameLobbyUpdate, this.onGameLobbyUpdate);
	}

	onJoinFailed = (data: SocketContract.IJoinFailedData) => {
		switch (data.reason) {
			case SocketContract.JoinFailedReason.GameFull:
				this.joinFailed = 'Unable to join game: game full';
				break;
			case SocketContract.JoinFailedReason.NotExists:
				this.joinFailed = 'Unable to join game: game no longer exists';
				break;
			default:
		}
	}

	onDismissJoinFailed = () => {
		this.joinFailed = '';
	}

	onLobbyUpdate = (data: SocketContract.ILobbyUpdateData) => {
		updateLobby(data);
	}

	onGameLobbyUpdate = (data: SocketContract.IGameLobbyUpdateData) => {
		updateGameLobby(data);
		this.props.switchScreen(ScreenType.GameLobby);
	}

	onClickHeaderLobby = () => {
		this.selectedTab = 'lobby';
	}

	onClickHeaderProgress = () => {
		this.selectedTab = 'progress';
	}

	onClickHeaderCreate = () => {
		this.selectedTab = 'create';
	}

	onClickCreate = () => {
		const data: SocketContract.ICreateGameData = {
			map: 'test',
			numTeams: 2,
			maxPlayersPerTeam: 4,
			title: 'test title',
		};
		this.props.socket.emit(SocketEvent.CreateGame, data);
	}

	onClickAvatarNext = () => {
		changeAvatar(true);
	}

	onClickAvatarPrev = () => {
		changeAvatar(false);
	}

	onJoinLobby = (gameLobbyId: string) => {
		const data: SocketContract.IJoinGameLobbyData = {
			gameLobbyId
		};
		this.props.socket.emit(SocketEvent.JoinGame, data);
	}

	getBodyLobby() {
		return (
			<div className={'LobbyScreen-body-lobby'}>
				{lobbyStore.lobbies.length === 0 && (
					<div>{'No games found'}</div>
				)}
				{lobbyStore.lobbies.map(lobby => {
					return (
						<div className={'LobbyScreen-lobby'} key={lobby.id}>
							<span className={'LobbyScreen-lobbyTitle'}>
								{lobby.title}
							</span>
							<div className={'LobbyScreen-lobbySpacer'} />
							<div className={'LobbyScreen-lobbyPlayers'}>
								({lobby.numPlayers + '/' + lobby.maxPlayers})
							</div>
							<div className={'LobbyScreen-lobbyJoin'} onClick={() => { this.onJoinLobby(lobby.id); }}>
								{'Join'}
							</div>
						</div>
					);
				})}
			</div>
		);
	}

	getBodyProgress() {
		return (
			<div className={'LobbyScreen-body-progress'}>
				{'In progress games'}
			</div>
		);
	}

	getBodyCreate() {
		return (
			<div className={'LobbyScreen--body-create'}>
				<div className={'LobbyScreen-createGame button'} onClick={this.onClickCreate}>
					{'Create Game'}
				</div>
			</div>
		);
	}

	public render() {
		const lobbyHeaderClasses = classNames('LobbyScreen-headerEntry', {
			'LobbyScreen-headerEntry--selected': this.selectedTab === 'lobby'
		});
		const progressHeaderClasses = classNames('LobbyScreen-headerEntry', {
			'LobbyScreen-headerEntry--selected': this.selectedTab === 'progress'
		});
		const createHeaderClasses = classNames('LobbyScreen-headerEntry', {
			'LobbyScreen-headerEntry--selected': this.selectedTab === 'create'
		});

		const avatarPath = `assets/avatars/${SocketContract.AVATAR_NAMES[RootStore.avatarIndex]}.png`;

		return (
			<div className={'LobbyScreen'}>
				<div className={'LobbyScreen-header'}>
					<img className={'LobbyScreen-avatarPrev'} onClick={this.onClickAvatarPrev} src={'assets/icons/arrowLeft.png'} />
					<img src={avatarPath} className={'LobbyScreen-header-avatar'} />
					<img className={'LobbyScreen-avatarNext'} onClick={this.onClickAvatarNext} src={'assets/icons/arrowRight.png'} />
					<span className={'LobbyScreen-header-username'}>
						{RootStore.username}
					</span>
				</div>
				<div className={'LobbyScreen-headers'}>
					<span className={lobbyHeaderClasses} onClick={this.onClickHeaderLobby}>
						{`Lobby (${lobbyStore.lobbies.length})`}
					</span>
					<span className={progressHeaderClasses} onClick={this.onClickHeaderProgress}>
						{`In Progress (0)`}
					</span>
					<span className={createHeaderClasses} onClick={this.onClickHeaderCreate}>
						{'Create Game'}
					</span>
				</div>
				<div className={'LobbyScreen-bodyRow'}>
					<div className={'LobbyScreen-body'}>
						{this.selectedTab === 'lobby' && this.getBodyLobby()}
						{this.selectedTab === 'progress' && this.getBodyProgress()}
						{this.selectedTab === 'create' && this.getBodyCreate()}
					</div>
					<div className={'LobbyScreen-sidePanel'}>
						<div className={'LobbyScreen-numPlayers'}>
							<div>{'Players Online'}</div>
							<hr />
							<div>{'Lobby: ' + lobbyStore.numPlayers.lobby}</div>
							<div>{'Joining games: ' + lobbyStore.numPlayers.gameLobby}</div>
							<div>{'In game: ' + lobbyStore.numPlayers.game}</div>
						</div>
					</div>
				</div>
				{this.joinFailed && (
					<div className={'LobbyScreen-loginFailed'}>
						{this.joinFailed}
						<span className={'LobbyScreen-dismissLoginFailed button'} onClick={this.onDismissJoinFailed}>
							{'OK'}
						</span>
					</div>
				)}
			</div >
		);
	}
}

export default LobbyScreen;
