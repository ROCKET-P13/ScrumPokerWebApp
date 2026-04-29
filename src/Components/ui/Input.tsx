import { forwardRef, InputHTMLAttributes, ChangeEvent } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

const InputTypes = {
	TEXT: 'text',
	NUMBER: 'number',
} as const;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	alphanumeric?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className = '',
			type = 'text',
			label,
			error,
			required,
			id,
			value = '',
			alphanumeric = false,
			onChange,
			...props
		},
		ref
	) => {
		const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
			let newValue = e.target.value;

			if (type === InputTypes.NUMBER) {
				newValue = newValue.replace(/[^\d]/g, '');
			}

			if (alphanumeric) {
				newValue = newValue.replace(/[^a-zA-Z0-9]/g, '');
			}

			e.target.value = newValue;
			onChange?.(e);
		};

		return (
			<div className="space-y-4">
				{
					label && (
						<label
							htmlFor={id}
							className={
								mergeTailwindClasses(
									'text-sm font-medium leading-none',
									'text-foreground',
									error ? 'text-destructive' : ''
								)
							}
						>
							{label}
							{
								required && (
									<span className="ml-1 text-destructive">*</span>
								)
							}
						</label>
					)
				}

				<input
					id={id}
					ref={ref}
					type={type === InputTypes.NUMBER ? InputTypes.TEXT : type}
					inputMode={type === InputTypes.NUMBER ? 'numeric' : undefined}
					aria-invalid={!!error}
					aria-required={required}
					value={value || ''}
					onChange={handleChange}
					className={
						mergeTailwindClasses(
							'flex h-10 w-full rounded-md border px-3 py-2 mt-1 text-sm',
							'bg-background text-foreground border-input',
							'placeholder:text-muted-foreground',
							'transition-colors',
							'focus-visible:outline-none',
							'focus-visible:ring-2',
							'focus-visible:ring-ring',
							'focus-visible:ring-offset-2',
							'focus-visible:ring-offset-background',
							'disabled:cursor-not-allowed disabled:opacity-50',
							'file:border-0 file:bg-transparent file:text-sm file:font-medium',
							error ? 'border-destructive focus-visible:ring-destructive' : '',
							className
						)
					}
					{...props}
				/>
			</div>
		);
	}
);

Input.displayName = 'Input';
