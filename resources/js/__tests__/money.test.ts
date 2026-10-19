import { arDigits, arNum, formatMoney, formatMoneyFixed } from '@/lib/money';
import { describe, expect, it } from 'vitest';

describe('money formatting (minor units, no floats)', () => {
    it('drops zero fraction and groups thousands', () => {
        expect(formatMoney(125000)).toBe('1,250 ج.م');
        expect(formatMoney(125050)).toBe('1,250.50 ج.م');
    });
    it('always shows two decimals when fixed', () => {
        expect(formatMoneyFixed(200)).toBe('2.00 ج.م');
        expect(formatMoneyFixed(-5)).toBe('-0.05 ج.م');
    });
    it('uses Arabic-Indic digits for designer UI', () => {
        expect(arDigits(2026)).toBe('٢٠٢٦');
        expect(arNum(1000)).toBe('١٬٠٠٠');
    });
});
