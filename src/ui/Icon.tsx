import { forwardRef, ComponentType, SVGProps } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

interface IconProps extends SVGProps<SVGSVGElement> {
  as: ComponentType<SVGProps<SVGSVGElement>>;
  size?: number;
  className?: string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
	(
		{
			as: Component,
			size = 14,
			className = '',
			...props
		},
		ref
	) => {
		if (!Component) return null;

		return (
			<Component
				ref={ref}
				width={size}
				height={size}
				className={
					mergeTailwindClasses(
						'transition-colors',
						className
					)
				}
				{...props}
			/>
		);
	}
);

Icon.displayName = 'Icon';