import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import * as SocketContract from '../shared/socketContract';
import { SocketEvent } from '../shared/socketContract';
import { updateLobby } from './Actions';
import { ScreenType } from './App';

import GameCanvas from './GameCanvas';

import './GameScreen.css';

export interface IGameScreenProps {
	socket: SocketIOClient.Socket;
	switchScreen: (type: ScreenType) => void;
}

@observer
class GameScreen extends React.Component<IGameScreenProps> {
	canvas: HTMLCanvasElement | null;
	gameCanvas: GameCanvas;

	componentDidMount() {
		this.attachSocketListeners();
		this.gameCanvas = new GameCanvas(this.canvas, this.props.socket);
	}

	componentWillUnmount() {
		this.removeSocketListeners();
		this.gameCanvas.willUnmount();
	}

	attachSocketListeners() {
		this.props.socket.on(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
	}

	removeSocketListeners() {
		this.props.socket.removeEventListener(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
	}

	onLobbyUpdate = (data: SocketContract.ILobbyUpdateData) => {
		updateLobby(data);
		this.props.switchScreen(ScreenType.Lobby);
	}

	public render() {
		return (
			<div className={'GameScreen'}>
				<canvas ref={x => { this.canvas = x; }} width={800} height={400} className={'GameScreen-canvas'}>
					{'Canvas not supported in your browser'}
				</canvas>
			</div>
		);
	}
}

export default GameScreen;
