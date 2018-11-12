import { observer } from 'mobx-react';
import * as React from 'react';

import './RadioGroup.css';

export interface IRadioGroupProps {
	title: string;
	options: string[];
	value: string;
	onChangeValue: (value: string) => void;
}

@observer
class RadioGroup extends React.Component<IRadioGroupProps> {

	componentDidUpdate(prevProps: IRadioGroupProps) {
		if (prevProps.options !== this.props.options) {
			if (this.props.value && this.props.options.indexOf(this.props.value) < 0) {
				this.props.onChangeValue('');
			}
		}
	}

	onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		this.props.onChangeValue(e.target.value);
	}

	public render() {
		return (
			<div className={'RadioGroup'}>
				<div className={'RadioGroup-title'}>
					{this.props.title}
				</div>
				<div className={'RadioGroup-options'}>
					{this.props.options.map(option => {
						return (
							<div className={'RadioGroup-option'} key={option}>
								<input
									type="radio"
									value={option}
									checked={this.props.value === option}
									onChange={this.onChange}
								/>
								{option}
							</div>
						);
					})}
				</div>
			</div >
		);
	}
}

export default RadioGroup;
