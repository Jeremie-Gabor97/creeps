import classNames from 'classnames';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import * as SocketContract from '../shared/socketContract';
import { SocketEvent } from '../shared/socketContract';
import { addLobbyChat, changeAvatar, updateGameLobby, updateLobby } from './Actions';
import { ScreenType } from './App';
import ChatBox from './ChatBox';
import RadioGroup from './RadioGroup';
import RootStore, { lobbyStore } from './Stores';

import './LobbyScreen.css';

export interface ILobbyScreenProps {
	socket: SocketIOClient.Socket;
	switchScreen: (type: ScreenType) => void;
}

@observer
class LobbyScreen extends React.Component<ILobbyScreenProps> {
	usernameInput: HTMLInputElement | null;
	createTitleRef: HTMLInputElement | null;
	@observable selectedTab: 'lobby' | 'progress' | 'create' = 'lobby';
	@observable joinFailed: string = '';
	@observable createTitle: string = 'Sweet Game';
	@observable createNumTeams: string = '2';
	@observable createMaxPlayers: string = '4';
	@observable createMap: string = 'Test Map';
	@observable lobbyInfoId: string = '';

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
		this.props.socket.on(SocketEvent.ReceiveChat, this.onReceiveChat);
	}

	removeSocketListeners() {
		this.props.socket.removeEventListener(SocketEvent.JoinFailed, this.onJoinFailed);
		this.props.socket.removeEventListener(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
		this.props.socket.removeEventListener(SocketEvent.GameLobbyUpdate, this.onGameLobbyUpdate);
		this.props.socket.removeEventListener(SocketEvent.ReceiveChat, this.onReceiveChat);
	}

	onSendChat = (message: string) => {
		const data: SocketContract.ISendChatData = {
			message
		};
		this.props.socket.emit(SocketEvent.SendChat, data);
	}

	onReceiveChat = (data: SocketContract.IReceiveChatData) => {
		addLobbyChat(data);
	}

	onJoinFailed = (data: SocketContract.IJoinFailedData) => {
		switch (data.reason) {
			case SocketContract.JoinFailedReason.GameFull:
				this.joinFailed = 'Unable to join game: game full';
				break;
			case SocketContract.JoinFailedReason.NotExists:
				this.joinFailed = 'Unable to join game: game no longer exists';
				break;
			case SocketContract.JoinFailedReason.GameStarted:
				this.joinFailed = 'Unable to join game: game already started';
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
		// TODO: validate this
		const numTeams = parseInt(this.createNumTeams, 10);
		const maxPlayersPerTeam = parseInt(this.createMaxPlayers, 10);
		const data: SocketContract.ICreateGameData = {
			map: this.createMap,
			numTeams,
			maxPlayersPerTeam,
			title: this.createTitle,
		};
		this.props.socket.emit(SocketEvent.CreateGame, data);
	}

	onClickAvatarNext = () => {
		changeAvatar(this.props.socket, true);
	}

	onClickAvatarPrev = () => {
		changeAvatar(this.props.socket, false);
	}

	onClickJoinLobby = (gameLobbyId: string) => {
		const data: SocketContract.IJoinGameLobbyData = {
			gameLobbyId
		};
		this.props.socket.emit(SocketEvent.JoinGame, data);
	}

	onClickLobbyInfo = (gameLobbyId: string) => {
		this.lobbyInfoId = gameLobbyId;
	}

	onClickLobbyInfoPanelClose = () => {
		this.lobbyInfoId = '';
	}

	onChangeCreateTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
		this.createTitle = e.target.value;
	}

	onChangeCreateNumTeams = (value: string) => {
		this.createNumTeams = value;
	}

	onChangeCreateMaxPlayers = (value: string) => {
		this.createMaxPlayers = value;
	}

	onChangeCreateMap = (value: string) => {
		this.createMap = value;
	}

	getBodyLobby() {
		return (
			<div className={'LobbyScreen-body-lobby'} key={'body-lobby'}>
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
							<div className={'LobbyScreen-lobbyInfo'} onClick={() => { this.onClickLobbyInfo(lobby.id); }}>
								{'Info'}
							</div>
							<div className={'LobbyScreen-lobbyJoin'} onClick={() => { this.onClickJoinLobby(lobby.id); }}>
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
			<div className={'LobbyScreen-body-progress'} key={'body-progress'}>
				{'In progress games'}
			</div>
		);
	}

	getBodyCreate() {
		return (
			<div className={'LobbyScreen--body-create'} key={'body-create'}>
				<div className={'LobbyScreen-createTitleLabel'}>{'Game Title'}</div>
				<input
					className={'LobbyScreen-createTitle'}
					value={this.createTitle}
					onChange={this.onChangeCreateTitle}
				/>
				<RadioGroup
					title={'Map'}
					options={['test']}
					value={this.createMap}
					onChangeValue={this.onChangeCreateMap}
				/>
				<RadioGroup
					title={'Number of teams'}
					options={['2', '4']}
					value={this.createNumTeams}
					onChangeValue={this.onChangeCreateNumTeams}
				/>
				<RadioGroup
					title={'Max players per team'}
					options={['1', '2', '3', '4']}
					value={this.createMaxPlayers}
					onChangeValue={this.onChangeCreateMaxPlayers}
				/>
				<div className={'LobbyScreen-createGame button'} onClick={this.onClickCreate}>
					{'Create Game'}
				</div>
			</div>
		);
	}

	getSidePanelLobby() {
		if (this.lobbyInfoId) {
			const lobbyIndex = lobbyStore.lobbies.findIndex(lobby => lobby.id === this.lobbyInfoId);
			if (lobbyIndex >= 0) {
				const lobby = lobbyStore.lobbies[lobbyIndex];
				return (
					<div className={'LobbyScreen-lobbyInfoPanel'}>
						<div>{lobby.title}</div>
						<hr />
						<div className={'LobbyScreen-lobbyInfoPanelNames'}>
							{lobby.playerNames.map(username => {
								return (
									<div>{username}</div>
								);
							})}
						</div>
						<div className={'LobbyScreen-lobbyInfoPanelClose button'} onClick={this.onClickLobbyInfoPanelClose}>
							{'Close'}
						</div>
					</div>
				);
			}
			else {
				this.lobbyInfoId = '';
				return this.getNumPlayers();
			}
		}
		else {
			return this.getNumPlayers();
		}
	}

	getSidePanelProgress() {
		return this.getNumPlayers();
	}

	getSidePanelCreate() {
		return this.getNumPlayers();
	}

	getNumPlayers = () => {
		return (
			<div className={'LobbyScreen-numPlayers'} key={'getNumPlayers'}>
				<div>{'Players Online'}</div>
				<hr />
				<div>{'Lobby: ' + lobbyStore.numPlayers.lobby}</div>
				<div>{'Joining games: ' + lobbyStore.numPlayers.gameLobby}</div>
				<div>{'In game: ' + lobbyStore.numPlayers.game}</div>
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
				<div className={'LobbyScreen-main'}>
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
							{this.selectedTab === 'lobby' && this.getSidePanelLobby()}
							{this.selectedTab === 'progress' && this.getSidePanelProgress()}
							{this.selectedTab === 'create' && this.getSidePanelCreate()}
						</div>
					</div>
				</div>
				<ChatBox messages={lobbyStore.chatMessages} onSendChat={this.onSendChat} />
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
