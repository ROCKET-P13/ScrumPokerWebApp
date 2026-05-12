import { forwardRef, HTMLAttributes, useState } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

interface SwitchProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> {
	checked?: boolean;
	defaultChecked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
	label?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
	(
		{
			checked: controlledChecked,
			defaultChecked,
			onChange,
			disabled = false,
			className = '',
			label,
			...props
		},
		ref
	) => {
		const [internalChecked, setInternalChecked] = useState(defaultChecked || false);

		const isControlled = controlledChecked !== undefined;
		const checked = isControlled ? controlledChecked : internalChecked;

		const toggle = () => {
			if (disabled) return;
			if (!isControlled) setInternalChecked(!checked);
			onChange?.(!checked);
		};

		return (
			<div className='space-y-4 flex flex-row'>
				<button
					type="button"
					ref={ref}
					role="switch"
					aria-checked={checked}
					disabled={disabled}
					onClick={toggle}
					className={
						mergeTailwindClasses(
							'inline-flex shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors focus:outline-none',
							checked ? 'bg-primary' : 'bg-muted',
							disabled ? 'opacity-50 cursor-not-allowed' : '',
							className
						)
					}
					{...props}
				>
					<span
						className={
							mergeTailwindClasses(
								'inline-block h-5 w-5 rounded-full bg-background shadow transform ring-0 transition-transform',
								checked ? 'translate-x-5' : 'translate-x-0'
							)
						}
					/>
				</button>
				<label className='ml-4'>{label}</label>
			</div>
		);
	}
);

Switch.displayName = 'Switch';
