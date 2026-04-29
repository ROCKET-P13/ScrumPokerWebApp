import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const mergeTailwindClasses = (...inputs: string[]) : string => twMerge(clsx(inputs));