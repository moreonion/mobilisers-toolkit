import type { TestVariation } from "../../types/ab-testing";

/**
 * Test preset data for development mode
 * Provides realistic A/B test scenarios to quickly fill the form
 */

export interface TestPreset {
	name: string;
	description: string;
	controlVariation: TestVariation;
	variations: TestVariation[];
	confidenceLevel: number;
}

/**
 * Two-variation test presets
 */
export const twoVariationPresets: TestPreset[] = [
	{
		name: "🟢 Clear Winner (Significant)",
		description: "Button colour change with significant improvement",
		controlVariation: { name: "Blue Button", visitors: 10000, conversions: 1200 },
		variations: [{ name: "Red Button", visitors: 10000, conversions: 1440 }],
		confidenceLevel: 0.95
	},
	{
		name: "🔴 No Difference (Not Significant)",
		description: "Headline test with no meaningful change",
		controlVariation: { name: "Original", visitors: 8000, conversions: 480 },
		variations: [{ name: "New Copy", visitors: 8000, conversions: 495 }],
		confidenceLevel: 0.95
	},
	{
		name: "📉 Negative Result (Significant Decline)",
		description: "Form change that hurt conversions",
		controlVariation: { name: "Simple Form", visitors: 5000, conversions: 750 },
		variations: [{ name: "Complex Form", visitors: 5000, conversions: 650 }],
		confidenceLevel: 0.95
	},
	{
		name: "🔍 Small Sample (Too Early)",
		description: "Test just started, not enough data yet",
		controlVariation: { name: "Control", visitors: 150, conversions: 12 },
		variations: [{ name: "Variation", visitors: 145, conversions: 15 }],
		confidenceLevel: 0.95
	},
	{
		name: "💰 High-Stakes E-commerce",
		description: "Checkout flow optimisation with large traffic",
		controlVariation: { name: "Current Checkout", visitors: 25000, conversions: 3750 },
		variations: [{ name: "One-Page Checkout", visitors: 25000, conversions: 4125 }],
		confidenceLevel: 0.99
	},
	{
		name: "📱 Mobile Landing Page",
		description: "Mobile-first design vs responsive",
		controlVariation: { name: "Responsive", visitors: 12000, conversions: 840 },
		variations: [{ name: "Mobile-First", visitors: 12000, conversions: 912 }],
		confidenceLevel: 0.95
	},
	{
		name: "🎯 Low Conversion Rate",
		description: "Newsletter signup optimisation",
		controlVariation: { name: "Small Form", visitors: 50000, conversions: 150 },
		variations: [{ name: "Exit Intent", visitors: 50000, conversions: 225 }],
		confidenceLevel: 0.95
	}
];

/**
 * Multi-variation test presets (3+ variations)
 */
export const multiVariationPresets: TestPreset[] = [
	{
		name: "🎨 Button Colour Battle (3 colours)",
		description: "Testing multiple button colours against control",
		controlVariation: { name: "Blue", visitors: 8000, conversions: 800 },
		variations: [
			{ name: "Red", visitors: 8000, conversions: 880 },
			{ name: "Green", visitors: 8000, conversions: 840 }
		],
		confidenceLevel: 0.95
	},
	{
		name: "📝 Headline Showdown (4 options)",
		description: "Testing different value propositions",
		controlVariation: { name: "Save Money", visitors: 6000, conversions: 420 },
		variations: [
			{ name: "Save Time", visitors: 6000, conversions: 480 },
			{ name: "Get Results", visitors: 6000, conversions: 450 },
			{ name: "Join Thousands", visitors: 6000, conversions: 390 }
		],
		confidenceLevel: 0.95
	},
	{
		name: "🏆 Clear Multi-Winner",
		description: "Two variations significantly outperform control",
		controlVariation: { name: "Original", visitors: 8000, conversions: 400 },
		variations: [
			{ name: "Version A", visitors: 8000, conversions: 600 },
			{ name: "Version B", visitors: 8000, conversions: 640 },
			{ name: "Version C", visitors: 8000, conversions: 440 }
		],
		confidenceLevel: 0.95
	},
	{
		name: "❓ Inconclusive Multi-Test",
		description: "Multiple variations but no clear statistical winner",
		controlVariation: { name: "Control", visitors: 4000, conversions: 280 },
		variations: [
			{ name: "Test 1", visitors: 4000, conversions: 300 },
			{ name: "Test 2", visitors: 4000, conversions: 290 },
			{ name: "Test 3", visitors: 4000, conversions: 295 },
			{ name: "Test 4", visitors: 4000, conversions: 285 }
		],
		confidenceLevel: 0.95
	},
	{
		name: "🚀 Pricing Page Experiment (5 layouts)",
		description: "Testing different pricing page layouts",
		controlVariation: { name: "Table View", visitors: 3000, conversions: 450 },
		variations: [
			{ name: "Card View", visitors: 3000, conversions: 510 },
			{ name: "List View", visitors: 3000, conversions: 465 },
			{ name: "Comparison", visitors: 3000, conversions: 495 },
			{ name: "Minimal", visitors: 3000, conversions: 420 }
		],
		confidenceLevel: 0.95
	},
	{
		name: "🎪 Extreme Multi-Variation (6 options)",
		description: "Testing many options (demonstrates correction effects)",
		controlVariation: { name: "A", visitors: 2000, conversions: 200 },
		variations: [
			{ name: "B", visitors: 2000, conversions: 220 },
			{ name: "C", visitors: 2000, conversions: 205 },
			{ name: "D", visitors: 2000, conversions: 215 },
			{ name: "E", visitors: 2000, conversions: 210 },
			{ name: "F", visitors: 2000, conversions: 225 }
		],
		confidenceLevel: 0.95
	},
	{
		name: "🏅 Single Clear Winner",
		description: "One variation significantly outperforms all others",
		controlVariation: { name: "Original", visitors: 10000, conversions: 500 },
		variations: [
			{ name: "Winner", visitors: 10000, conversions: 750 },
			{ name: "Similar 1", visitors: 10000, conversions: 520 },
			{ name: "Similar 2", visitors: 10000, conversions: 510 }
		],
		confidenceLevel: 0.95
	}
];

/**
 * Get all available presets
 */
export function getAllPresets(): TestPreset[] {
	return [...twoVariationPresets, ...multiVariationPresets];
}

/**
 * Find preset by name
 */
export function getPresetByName(name: string): TestPreset | undefined {
	return getAllPresets().find(preset => preset.name === name);
}