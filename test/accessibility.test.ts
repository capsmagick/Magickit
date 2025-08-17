import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	generateId,
	getContrastRatio,
	meetsContrastRequirement
} from './accessibility';

// Only test functions that don't require DOM in server environment

describe('Accessibility Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('generateId', () => {
		it('generates unique IDs with default prefix', () => {
			const id1 = generateId();
			const id2 = generateId();
			
			expect(id1).toMatch(/^id-[a-z0-9]+$/);
			expect(id2).toMatch(/^id-[a-z0-9]+$/);
			expect(id1).not.toBe(id2);
		});

		it('generates unique IDs with custom prefix', () => {
			const id = generateId('custom');
			expect(id).toMatch(/^custom-[a-z0-9]+$/);
		});
	});

	describe('getContrastRatio', () => {
		it('calculates contrast ratio correctly', () => {
			// Black on white should have high contrast
			const ratio = getContrastRatio('#000000', '#ffffff');
			expect(ratio).toBeCloseTo(21, 0);
		});

		it('calculates same color contrast', () => {
			const ratio = getContrastRatio('#ffffff', '#ffffff');
			expect(ratio).toBeCloseTo(1, 0);
		});

		it('handles invalid hex colors', () => {
			const ratio = getContrastRatio('invalid', '#ffffff');
			expect(ratio).toBe(0);
		});
	});

	describe('meetsContrastRequirement', () => {
		it('passes AA normal text requirements', () => {
			expect(meetsContrastRequirement('#000000', '#ffffff', 'AA', 'normal')).toBe(true);
			expect(meetsContrastRequirement('#767676', '#ffffff', 'AA', 'normal')).toBe(true);
		});

		it('fails AA normal text requirements', () => {
			expect(meetsContrastRequirement('#cccccc', '#ffffff', 'AA', 'normal')).toBe(false);
		});

		it('has different requirements for large text', () => {
			// Use a color that actually meets the 3:1 ratio for large text
			expect(meetsContrastRequirement('#949494', '#ffffff', 'AA', 'large')).toBe(true);
			expect(meetsContrastRequirement('#949494', '#ffffff', 'AA', 'normal')).toBe(false);
		});

		it('passes AAA requirements', () => {
			expect(meetsContrastRequirement('#000000', '#ffffff', 'AAA', 'normal')).toBe(true);
			expect(meetsContrastRequirement('#595959', '#ffffff', 'AAA', 'normal')).toBe(true);
		});

		it('fails AAA requirements with insufficient contrast', () => {
			expect(meetsContrastRequirement('#767676', '#ffffff', 'AAA', 'normal')).toBe(false);
		});
	});
});