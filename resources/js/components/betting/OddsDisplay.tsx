import { memo } from 'react';
import type { OddsDisplayProps } from '../../types/betting.types';

const OddsDisplay = memo(({ odds, format = 'decimal', size = 'medium', highlight = false }: OddsDisplayProps) => {
  const formatOdds = (odds: number, format: 'decimal' | 'fractional' | 'american') => {
    switch (format) {
      case 'fractional': {
        const numerator = Math.round((odds - 1) * 100);
        const denominator = 100;
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        const divisor = gcd(numerator, denominator);
        return `${numerator / divisor}/${denominator / divisor}`;
      }

      case 'american':
        return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;

      case 'decimal':
      default:
        return odds.toFixed(2);
    }
  };

  const sizeClasses = {
    small: 'text-sm px-2 py-1',
    medium: 'text-base px-3 py-1.5',
    large: 'text-lg px-4 py-2',
  };

  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClasses[size]} ${
        highlight
          ? 'bg-gradient-to-r from-green-500 to-blue-500 font-bold text-white'
          : 'bg-gray-100 font-semibold text-gray-900 dark:bg-gray-700 dark:text-gray-100'
      } rounded-lg border transition-all duration-200 ${highlight ? 'border-green-400 shadow-lg' : 'border-gray-200 dark:border-gray-600'} `}
    >
      {formatOdds(parseFloat(String(odds)), format)}
    </span>
  );
});

OddsDisplay.displayName = 'OddsDisplay';

export default OddsDisplay;
