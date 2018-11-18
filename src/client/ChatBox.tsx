import { observable, when } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Key } from 'ts-key-enum';
import * as SocketContract from '../shared/socketContract';

import './ChatBox.css';

export interface IChatBoxProps {
	messages: SocketContract.IReceiveChatData[];
	onSendChat: (message: string) => void;
}

@observer
class ChatBox extends React.Component<IChatBoxProps> {
	messagesRef: HTMLDivElement | null;
	inputRef: HTMLInputElement | null;
	shouldStayAtBottom: boolean = false;
	@observable message: string = '';

	UNSAFE_componentWillUpdate(nextProps: IChatBoxProps) {
		if (this.shouldStayAtBottom === false) {
			const maxScroll = this.messagesRef.scrollHeight - this.messagesRef.offsetHeight;
			if (maxScroll - this.messagesRef.scrollTop < 1) {
				this.shouldStayAtBottom = true;
			}
		}
	}

	componentDidUpdate(prevProps: IChatBoxProps) {
		if (this.shouldStayAtBottom) {
			this.shouldStayAtBottom = false;
			if (this.messagesRef) {
				const maxScroll = this.messagesRef.scrollHeight - this.messagesRef.offsetHeight;
				console.log(maxScroll);
				this.messagesRef.scrollTop = maxScroll;
			}
		}
	}

	setFocus() {
		if (this.inputRef) {
			this.inputRef.focus();
		}
	}

	submit() {
		if (this.message) {
			this.props.onSendChat(this.message);
			this.message = '';
		}
	}

	onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		this.message = e.target.value;
	}

	onClickSubmit = () => {
		this.submit();
	}

	onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === Key.Enter) {
			e.stopPropagation();
			this.submit();
		}
	}

	public render() {
		return (
			<div className={'ChatBox'}>
				<div className={'ChatBox-messages'} ref={x => { this.messagesRef = x; }}>
					{this.props.messages.map((message, index) => {
						return (
							<div className={'ChatBox-message'} key={index}>
								{message.isSystem === false && (message.username + ': ')}{message.message}
							</div>
						);
					})}
				</div>
				<div className={'ChatBox-inputContainer'}>
					<input
						className={'ChatBox-input'}
						onChange={this.onChange}
						value={this.message}
						ref={x => { this.inputRef = x; }}
						onKeyUp={this.onKeyUp}
					/>
					<div className={'ChatBox-submit button'} onClick={this.onClickSubmit}>
						{'Send'}
					</div>
				</div>
			</div >
		);
	}
}

export default ChatBox;
