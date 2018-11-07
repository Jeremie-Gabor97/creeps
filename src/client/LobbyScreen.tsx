import { extendObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import './LobbyScreen.css';

class LobbyScreen extends React.Component<{}> {
	usernameInput: HTMLInputElement | null;
	selectedTab: 'lobby' | 'progress';

	constructor(props: {}) {
		super(props);

		extendObservable(this, {
			selectedTab: 'lobby'
		});
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
			</div>
		);
	}
}

export default observer(LobbyScreen);
