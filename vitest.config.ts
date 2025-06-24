import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Test files location
		include: ['src/**/*.{test,spec}.{js,ts}'],
		
		// Test environment for DOM testing if needed
		environment: 'node',
		
		// Coverage settings
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/**/*.{js,ts}'],
			exclude: [
				'src/**/*.{test,spec}.{js,ts}',
				'src/**/*.d.ts',
				'src/env.d.ts'
			]
		},
		
		// Test timeout
		testTimeout: 10000,
		
		// Global test setup
		globals: true
	},
	
	// Path resolution to match Astro's setup
	resolve: {
		alias: {
			'@': '/src'
		}
	}
});