import classNames from 'classnames';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import * as SocketContract from '../shared/socketContract';
import { SocketEvent } from '../shared/socketContract';
import { updateGameLobby, updateLobby } from './Actions';
import { ScreenType } from './App';
import rootStore, { gameLobbyStore } from './Stores';

import './GameLobbyScreen.css';

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

	onClickStart = () => {
		this.props.socket.emit(SocketEvent.StartGame);
	}

	switchTeam = (team: number) => {
		const data: SocketContract.ISwitchTeamData = {
			team
		};
		this.props.socket.emit(SocketEvent.SwitchTeam, data);
	}

	getVersusString() {
		const numTeams = gameLobbyStore.numTeams;
		const players = gameLobbyStore.maxPlayersPerTeam;
		let numArray = [];
		for (let i = 0; i < numTeams; i++) {
			numArray.push(players);
		}
		return numArray.join('v');
	}

	getTeam(players: SocketContract.IGameLobbyPlayer[][], team: number) {
		const teamClasses = classNames('GameLobbyScreen-team', {
			'GameLobbyScreen-blueTeam': team === 0,
			'GameLobbyScreen-redTeam': team === 1,
			'GameLobbyScreen-greenTeam': team === 2,
			'GameLobbyScreen-yellowTeam': team === 3
		});
		return (
			<div className={teamClasses}>
				{players[team].map(player => {
					const avatarPath = `assets/avatars/${SocketContract.AVATAR_NAMES[player.avatarIndex]}.png`;
					return (
						<div className={'GameLobbyScreen-player'} key={player.username}>
							<img className={'GameLobbyScreen-playerAvatar'} src={avatarPath} />
							{player.username}
						</div>
					);
				})}
				{[...Array(gameLobbyStore.maxPlayersPerTeam - players[team].length)].map((num, index) => {
					return (
						<div className={'GameLobbyScreen-emptyPlayer'} key={'empty' + index}>
							{'Waiting for players...'}
						</div>
					);
				})}
			</div>
		);
	}

	public render() {
		const players: SocketContract.IGameLobbyPlayer[][] = [];
		for (let i = 0; i < gameLobbyStore.numTeams; i++) {
			players[i] = [];
		}
		Object.keys(gameLobbyStore.players).forEach(username => {
			const player = gameLobbyStore.players[username];
			players[player.team].push(player);
		});

		const me = gameLobbyStore.players[rootStore.username];
		const switchBlueClasses = classNames(
			'GameLobbyScreen-switchColor',
			'GameLobbyScreen-switchColorBlue',
			{
				'GameLobbyScreen-switchColor--selected': me.team === 0
			}
		);
		const switchRedClasses = classNames(
			'GameLobbyScreen-switchColor',
			'GameLobbyScreen-switchColorRed',
			{
				'GameLobbyScreen-switchColor--selected': me.team === 1
			}
		);
		const switchGreenClasses = classNames(
			'GameLobbyScreen-switchColor',
			'GameLobbyScreen-switchColorGreen',
			{
				'GameLobbyScreen-switchColor--selected': me.team === 2
			}
		);
		const switchYellowClasses = classNames(
			'GameLobbyScreen-switchColor',
			'GameLobbyScreen-switchColorYellow',
			{
				'GameLobbyScreen-switchColor--selected': me.team === 3
			}
		);

		return (
			<div className={'GameLobbyScreen'}>
				<div className={'GameLobbyScreen-teams'}>
					<div className={'GameLobbyScreen-spacer'}/>
					{this.getTeam(players, 0)}
					{gameLobbyStore.numTeams > 2 && <div className={'GameLobbyScreen-spacer'}/>}
					{gameLobbyStore.numTeams > 2 && this.getTeam(players, 1)}
					<div className={'GameLobbyScreen-spacer'}/>
				</div>
				<div className={'GameLobbyScreen-info'}>
					<div className={'GameLobbyScreen-title'}>
						{gameLobbyStore.title}
					</div>
					<div className={'GameLobbyScreen-map'}>
						{gameLobbyStore.map}
					</div>
					<div className={'GameLobbyScreen-numPlayers'}>
						{this.getVersusString()}
					</div>
					<div className={'GameLobbyScreen-spacer'}/>
					<div className={'GameLobbyScreen-switch'}>
						<div className={switchBlueClasses} onClick={() => { this.switchTeam(0); }} />
						{gameLobbyStore.numTeams > 2 && (
							<div className={switchGreenClasses} onClick={() => { this.switchTeam(2); }} />
						)}
						<div className={switchRedClasses} onClick={() => { this.switchTeam(1); }} />
						{gameLobbyStore.numTeams > 2 && (
							<div className={switchYellowClasses} onClick={() => { this.switchTeam(3); }} />
						)}
					</div>
					<div className={'GameLobbyScreen-spacer'}/>
					<div className={'GameLobbyScreen-start button'} onClick={this.onClickStart}>
						{'Start Game'}
					</div>
					<div className={'GameLobbyScreen-leave button'} onClick={this.onClickLeave}>
						{'Leave Game'}
					</div>
				</div>
				<div className={'GameLobbyScreen-teams'}>
					<div className={'GameLobbyScreen-spacer'}/>
					{gameLobbyStore.numTeams === 2 && this.getTeam(players, 1)}
					{gameLobbyStore.numTeams > 2 && this.getTeam(players, 2)}
					{gameLobbyStore.numTeams > 3 && <div className={'GameLobbyScreen-spacer'}/>}
					{gameLobbyStore.numTeams > 3 && this.getTeam(players, 3)}
					<div className={'GameLobbyScreen-spacer'}/>
				</div>

			</div >
		);
	}
}

export default GameLobbyScreen;
