import * as React from 'react';
import './MainScreen.css';

export interface IMainScreenProps {
	onLogin: () => void;
}

class MainScreen extends React.Component<IMainScreenProps> {
	usernameInput: HTMLInputElement | null;

	onClickLogin = () => {
		if (this.usernameInput) {
			console.log(`Logging in with name ${this.usernameInput.value}`);
			this.props.onLogin();
		}
	}

	public render() {
		return (
			<div className={'MainScreen'}>
				<span className={'MainScreen-title'}>
					{'Creeps'}
				</span>
				<input className={'MainScreen-username'} type="text" ref={x => this.usernameInput = x }/>
				<div className={'MainScreen-login'} onClick={this.onClickLogin}>
					{'Login'}
				</div>
			</div>
		);
	}
}

export default MainScreen;
