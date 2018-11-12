import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import * as SocketContract from '../shared/socketContract';
import { SocketEvent } from '../shared/socketContract';
import { confirmUsername, updateLobby } from './Actions';
import { ScreenType } from './App';

import './MainScreen.css';

export interface IMainScreenProps {
	socket: SocketIOClient.Socket;
	switchScreen: (type: ScreenType) => void;
}

@observer
class MainScreen extends React.Component<IMainScreenProps> {
	usernameInput: HTMLInputElement | null;
	@observable loginFailed: string = '';

	componentDidMount() {
		this.attachSocketListeners();
	}

	componentWillUnmount() {
		this.removeSocketListeners();
	}

	attachSocketListeners() {
		this.props.socket.on(SocketEvent.ConfirmUsername, this.onConfirmUsername);
		this.props.socket.on(SocketEvent.LoginFailed, this.onLoginFailed);
		this.props.socket.on(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
	}

	removeSocketListeners() {
		this.props.socket.on(SocketEvent.ConfirmUsername, this.onConfirmUsername);
		this.props.socket.removeEventListener(SocketEvent.LoginFailed, this.onLoginFailed);
		this.props.socket.removeEventListener(SocketEvent.LobbyUpdate, this.onLobbyUpdate);
	}

	onConfirmUsername(username: string) {
		confirmUsername(username); 
	}

	onLoginFailed = (data: SocketContract.ILoginFailedData) => {
		switch (data.reason) {
			case SocketContract.LoginFailedReason.UsernameInUse:
				this.loginFailed = 'That username is currently in use';
				break;
			case SocketContract.LoginFailedReason.UsernameInvalid:
				this.loginFailed = 'Only alphanumeric names are allowed';
				break;
			case SocketContract.LoginFailedReason.UsernameTooLong:
				this.loginFailed = 'That username is too long (15 characters max)';
				break;
			default:
				this.loginFailed = 'Cannot log you in, not sure why though...';
		}
	}

	onLobbyUpdate = (data: SocketContract.ILobbyUpdateData) => {
		// logged in successfully
		if (data.arriving) {
			updateLobby(data);
			this.props.switchScreen(ScreenType.Lobby);
		}
	}

	onClickLogin = () => {
		if (this.usernameInput && this.usernameInput.value) {
			console.log(`Logging in with name ${this.usernameInput.value}`);
			const data: SocketContract.ILoginData = {
				username: this.usernameInput.value
			};
			this.props.socket.emit(SocketContract.SocketEvent.Login, data);
		}
	}

	onClickDismiss = () => {
		this.loginFailed = '';
	}

	public render() {
		return (
			<div className={'MainScreen'}>
				<div className={'MainScreen-title'}>
					{'Creeps'}
				</div>
				
				<div className={'MainScreen-loginBox'}>
					<div className={'MainScreen-usernameLabel'}>
						{'Username'}
					</div>
					<input className={'MainScreen-username'} type="text" ref={x => this.usernameInput = x} maxLength={15} />
					{this.loginFailed && (
						<div className={'MainScreen-loginFailed'}>
							{this.loginFailed}
						</div>
					)}
					<div className={'MainScreen-loginButtonContainer'}>
						<span className={'MainScreen-loginButton button'} onClick={this.onClickLogin}>
							{'Login'}
						</span>
					</div>
				</div>
			</div>
		);
	}
}

export default MainScreen;
