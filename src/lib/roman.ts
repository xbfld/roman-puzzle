import { RomanChar } from './types.js';

// 숫자를 로마숫자 문자열로 변환
export function toRoman(num: number): string {
  if (num <= 0 || num > 3999) {
    throw new Error('Number must be between 1 and 3999');
  }

  const romanNumerals: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let result = '';
  let remaining = num;

  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result;
}

// 로마숫자 문자열을 숫자로 변환
export function fromRoman(roman: string): number {
  const romanValues: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  let result = 0;
  let prevValue = 0;

  for (let i = roman.length - 1; i >= 0; i--) {
    const currentValue = romanValues[roman[i]];
    if (currentValue < prevValue) {
      result -= currentValue;
    } else {
      result += currentValue;
    }
    prevValue = currentValue;
  }

  return result;
}

// 유효한 로마숫자 문자인지 확인
export function isRomanChar(char: string): char is RomanChar {
  return ['I', 'V', 'X', 'L', 'C', 'D', 'M'].includes(char);
}

// 모든 로마숫자 문자 목록
export const ROMAN_CHARS: RomanChar[] = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];
