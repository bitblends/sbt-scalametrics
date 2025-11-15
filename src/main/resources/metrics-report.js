/*
 * SPDX-FileCopyrightText: 2025 Benjamin Saff and contributors
 * SPDX-License-Identifier: MIT
 */

// Base64-encoded GZIP compressed data placeholder
// This will be replaced by HtmlReportGenerator with actual compressed data
const compressedData = "{{METRICS_DATA_JS}}";

// Function to decompress Base64-encoded GZIP data
async function decompressData(base64String) {
	// Convert base64 to Uint8Array
	const binaryString = atob(base64String);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	// Create a ReadableStream from the bytes
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(bytes);
			controller.close();
		}
	});

	// Decompress using DecompressionStream API
	if (window.DecompressionStream) {
		const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
		const reader = decompressedStream.getReader();
		const chunks = [];

		while (true) {
			const {done, value} = await reader.read();
			if (done) break;
			chunks.push(value);
		}

		// Combine chunks and convert to string
		const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
		const result = new Uint8Array(totalLength);
		let position = 0;
		for (const chunk of chunks) {
			result.set(chunk, position);
			position += chunk.length;
		}

		return new TextDecoder().decode(result);
	} else {
		// Fallback for browsers without DecompressionStream
		// Using pako library as fallback
		if (typeof pako === 'undefined') {
			// Dynamically load pako if not already loaded
			await new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js';
				script.onload = resolve;
				script.onerror = reject;
				document.head.appendChild(script);
			});
		}

		const inflated = pako.inflate(bytes, {to: 'string'});
		return inflated;
	}
}

// Decompress and initialize metricsData
let metricsData;
let globalData;

// Define the initialization function
function initializePage() {

	// Dark Mode Toggle
	const themeToggleBtn = document.getElementById('theme-toggle');
	const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
	const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');

	// Check for saved theme preference or default to light mode
	const currentTheme = localStorage.getItem('theme') || 'light';

	// Apply theme on page load
	if (currentTheme === 'dark') {
		document.documentElement.classList.add('dark');
		themeToggleLightIcon.classList.add('hidden');
		themeToggleDarkIcon.classList.remove('hidden');
	}

	// Toggle theme on button click
	themeToggleBtn.addEventListener('click', function () {
		document.documentElement.classList.toggle('dark');

		if (document.documentElement.classList.contains('dark')) {
			themeToggleLightIcon.classList.add('hidden');
			themeToggleDarkIcon.classList.remove('hidden');
			localStorage.setItem('theme', 'dark');
		} else {
			themeToggleLightIcon.classList.remove('hidden');
			themeToggleDarkIcon.classList.add('hidden');
			localStorage.setItem('theme', 'light');
		}
	});

	// Toggle extended info table
	const toggleExtendedInfoBtn = document.getElementById('toggle-extended-info');
	const extendedInfoContent = document.getElementById('extended-info-content');
	const toggleText = document.getElementById('toggle-text');
	const toggleIcon = document.getElementById('toggle-icon');

	toggleExtendedInfoBtn.addEventListener('click', function () {
		if (extendedInfoContent.classList.contains('hidden')) {
			extendedInfoContent.classList.remove('hidden');
			toggleText.textContent = 'Hide Details';
			toggleIcon.style.transform = 'rotate(180deg)';
		} else {
			extendedInfoContent.classList.add('hidden');
			toggleText.textContent = 'Show Details';
			toggleIcon.style.transform = 'rotate(0deg)';
		}
	});

	// Tab Switching Function
	function switchTab(tabName) {
		// Define permanent tabs
		const permanentTabs = ['info', 'charts', 'tables'];
		const isPermanentTab = permanentTabs.includes(tabName);

		// Handle dynamic tab visibility based on new rules
		const fileDetailsTab = document.getElementById('file-details-tab');
		const fileDetailsContent = document.getElementById('file-details-content');
		const methodComplexityTab = document.getElementById('method-complexity-tab');
		const methodComplexityContent = document.getElementById('method-complexity-content');

		if (isPermanentTab) {
			// When clicking permanent tabs, hide both dynamic tabs
			if (fileDetailsTab) {
				fileDetailsTab.style.display = 'none';
			}
			if (fileDetailsContent) {
				fileDetailsContent.classList.remove('active');
			}
			if (methodComplexityTab) {
				methodComplexityTab.style.display = 'none';
			}
			if (methodComplexityContent) {
				methodComplexityContent.classList.remove('active');
			}
		} else if (tabName === 'file-details') {
			// When clicking file-details-tab, only hide method-complexity-tab
			if (methodComplexityTab) {
				methodComplexityTab.style.display = 'none';
			}
			if (methodComplexityContent) {
				methodComplexityContent.classList.remove('active');
			}
		} else if (tabName === 'method-complexity') {
			// When clicking method-complexity-tab, keep file-details-tab visible
			// Just focus the method-complexity-tab without hiding file-details-tab
		} else {
			// Default behavior for any other tabs
			if (tabName !== 'file-details') {
				if (fileDetailsTab) {
					fileDetailsTab.style.display = 'none';
				}
				if (fileDetailsContent) {
					fileDetailsContent.classList.remove('active');
				}
			}
			if (tabName !== 'method-complexity') {
				if (methodComplexityTab) {
					methodComplexityTab.style.display = 'none';
				}
				if (methodComplexityContent) {
					methodComplexityContent.classList.remove('active');
				}
			}
		}

		// Handle regular tab switching for content
		// First, remove active from ALL content areas
		document.querySelectorAll('.tab-content').forEach(content => {
			content.classList.remove('active');
		});

		// Handle tab button styling
		document.querySelectorAll('.tab-button').forEach(button => {
			// Special handling for file-details-tab when method-complexity is active
			if (tabName === 'method-complexity' && button.id === 'file-details-tab') {
				// Keep file-details-tab visible but not active (gray)
				button.classList.remove('border-blue-500', 'text-blue-600');
				button.classList.add('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700');
				return;
			}
			if ((button.id !== 'file-details-tab' || tabName === 'file-details') &&
				(button.id !== 'method-complexity-tab' || tabName === 'method-complexity')) {
				button.classList.remove('border-blue-500', 'text-blue-600');
				button.classList.add('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700');
			}
		});

		// Now activate ONLY the selected tab's content
		document.getElementById(tabName + '-content').classList.add('active');
		const activeTab = document.getElementById(tabName + '-tab');
		activeTab.classList.remove('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700');
		activeTab.classList.add('border-blue-500', 'text-blue-600');
	}

	/**
	 * Extracts the method name from a given method signature.
	 *
	 * @param {string} signature - The method signature in the format of "methodName(params): ReturnType" or "methodName[TypeParams](params): ReturnType".
	 * @return {string} The extracted method name. If no match is found, the part before the parenthesis is returned.
	 */
	function extractMethodName(signature) {
		// Extract the method name from signatures like:
		// "methodName(params): ReturnType"
		// "methodName[TypeParams](params): ReturnType"
		const match = signature.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
		return match ? match[1] : signature.split('(')[0].trim();
	}

	// Get complexity analysis text based on metrics
	function getComplexityAnalysis(methodData) {
		const analyses = [];

		// Cyclomatic complexity analysis
		const cc = methodData.complexity || 1;
		if (cc <= 5) {
			analyses.push(`<strong>Low complexity (${cc}):</strong> Simple, straightforward logic. Easy to test and maintain.`);
		} else if (cc <= 10) {
			analyses.push(`<strong>Moderate complexity (${cc}):</strong> Some branching logic. Consider refactoring if it grows further.`);
		} else if (cc <= 20) {
			analyses.push(`<strong>High complexity (${cc}):</strong> Complex control flow. Consider breaking down into smaller methods.`);
		} else {
			analyses.push(`<strong>Very high complexity (${cc}):</strong> Very complex logic. Strong candidate for refactoring.`);
		}

		// Nesting depth analysis
		const nd = methodData.nestingDepth || 0;
		if (nd > 3) {
			analyses.push(`<strong>Deep nesting (${nd} levels):</strong> Consider extracting nested logic into separate methods.`);
		}

		// Parameter complexity analysis
		const totalParams = methodData.parameterStats.totalParams || 0;
		const paramLists = methodData.parameterStats.paramLists || 0;

		if (totalParams > 5) {
			analyses.push(`<strong>Many parameters (${totalParams}):</strong> Consider using a parameter object or builder pattern.`);
		}

		if (paramLists > 1) {
			analyses.push(`<strong>Curried function (${paramLists} parameter lists):</strong> Uses partial application for flexibility.`);
		}

		// Special parameter types
		const specialParams = [];
		if (methodData.implicitParams > 0) {
			specialParams.push(`${methodData.inlineAndImplicitStats.implicitParams} implicit`);
		}
		if (methodData.defaultedParams > 0) {
			specialParams.push(`${methodData.inlineAndImplicitStats.defaultedParams} with defaults`);
		}
		if (methodData.byNameParams > 0) {
			specialParams.push(`${methodData.inlineAndImplicitStats.byNameParams} by-name`);
		}
		if (methodData.varargParams > 0) {
			specialParams.push(`${methodData.inlineAndImplicitStats.varargParams} vararg`);
		}

		if (specialParams.length > 0) {
			analyses.push(`<strong>Special parameters:</strong> ${specialParams.join(', ')}`);
		}

		// Pattern matching analysis
		const pmMatches = methodData.patternMatchingStats.matches || 0;
		if (pmMatches > 0) {
			const avgCases = methodData.patternMatchingStats.avgCasesPerMatch || 0;
			analyses.push(`<strong>Pattern matching (${pmMatches} match expressions):</strong> Average ${avgCases.toFixed(1)} cases per match.`);

			if (methodData.patternMatchingStats.maxNesting > 2) {
				analyses.push(`<strong>Nested matches (depth ${methodData.patternMatchingStats.maxNesting}):</strong> Consider extracting nested pattern matching logic.`);
			}

			if (avgCases > 5) {
				analyses.push(`<strong>Complex patterns:</strong> Many cases per match may indicate need for refactoring.`);
			}
		}

		// Documentation status
		const hasScaladoc = parseBoolean(methodData.hasScaladoc);
		if (!hasScaladoc && methodData.metadata.accessModifier === 'public') {
			analyses.push(`<strong>Missing documentation:</strong> Public method should have Scaladoc.`);
		}

		return analyses.join('<br><br>');
	}

	// Get complexity analysis for members
	function getMemberComplexityAnalysis(memberData) {
		const analyses = [];

		// Cyclomatic complexity analysis
		const cc = memberData.complexity || 1;
		if (cc <= 5) {
			analyses.push(`<strong>Low complexity (${cc}):</strong> Simple, straightforward logic. Easy to test and maintain.`);
		} else if (cc <= 10) {
			analyses.push(`<strong>Moderate complexity (${cc}):</strong> Some branching logic. Consider refactoring if it grows further.`);
		} else if (cc <= 20) {
			analyses.push(`<strong>High complexity (${cc}):</strong> Complex control flow. Consider breaking down into smaller methods.`);
		} else {
			analyses.push(`<strong>Very high complexity (${cc}):</strong> Very complex logic. Strong candidate for refactoring.`);
		}

		// Pattern matching analysis
		const pmMatches = memberData.patternMatchingStats.matches || 0;
		if (pmMatches > 0) {
			const avgCases = memberData.patternMatchingStats.avgCasesPerMatch || 0;
			analyses.push(`<strong>Pattern matching (${pmMatches} match expressions):</strong> Average ${avgCases.toFixed(1)} cases per match.`);

			if (memberData.patternMatchingStats.maxNesting > 2) {
				analyses.push(`<strong>Nested matches (depth ${memberData.patternMatchingStats.maxNesting}):</strong> Consider extracting nested pattern matching logic.`);
			}

			if (avgCases > 5) {
				analyses.push(`<strong>Complex patterns:</strong> Many cases per match may indicate need for refactoring.`);
			}
		}

		// Documentation status
		const hasScaladoc = parseBoolean(memberData.hasScaladoc);
		if (!hasScaladoc && memberData.metadata.accessModifier === 'public') {
			analyses.push(`<strong>Missing documentation:</strong> Public member should have Scaladoc.`);
		}

		return analyses.join('<br><br>');
	}

	// Open member complexity tab for a specific member
	function openMemberComplexityTab(memberName, memberData) {
		// Show the method complexity tab (reuse same tab)
		const methodComplexityTab = document.getElementById('method-complexity-tab');
		const methodComplexityTabName = document.getElementById('method-complexity-tab-name');

		if (methodComplexityTab) {
			methodComplexityTab.style.display = 'flex';
			methodComplexityTabName.textContent = `${memberName}: Complexity`;
		}

		// Update the content
		const methodComplexityPlaceholder = document.getElementById('method-complexity-placeholder');

		if (methodComplexityPlaceholder) {
			methodComplexityPlaceholder.innerHTML = `
                <!-- Member Signature -->
                <div class="text-center bg-gray-50 rounded-lg py-6">
                    <span class="font-mono text-md text-gray-700 dark:text-gray-300">${colorizeSignature(memberData.metadata.signature) || memberName}</span>
                </div>
                                
                <!-- Core Metrics & Pattern Matching (Centered) -->
                <div class="grid grid-cols-1 md:grid-cols-2 justify-items-center justify-center gap-5 py-6 px-6">
                    
                    <!-- Core Metrics -->
                    <div class="w-full mb-8">                        
                        <div class="border-b">
                            <h3 class="px-2 text-lg font-semibold text-gray-900 mb-3">Core Metrics</h3>
                        </div>
                        <table class="w-full table-auto border-collapse h-fit divide-y divide-gray-200 dark:divide-gray-700">
                            <tbody class="px-2 bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700">Member Type</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.metadata.declarationType || 'N/A'}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700">Lines of Code</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.metadata.linesOfCode || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Cyclomatic Complexity</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.complexity || '-'}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Nesting Depth</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">-</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Access Modifier</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.metadata.accessModifier || 'public'}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Has Scaladoc</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${parseBoolean(memberData.hasScaladoc) ? 'Yes' : 'No'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pattern Matching Metrics -->
                    <div class="w-full mb-8">
                        <div class="border-b">
                            <h3 class="px-2 text-lg font-semibold text-gray-900 mb-3">Pattern Matching Metrics</h3>
                        </div>
                        <table class="w-full table-auto border-collapse divide-y divide-gray-200 dark:divide-gray-700">
                            <tbody class="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Match Expressions</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.patternMatchingStats.matches || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Total Cases</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.patternMatchingStats.cases || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Guards</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.patternMatchingStats.guards || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Wildcards</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.patternMatchingStats.wildcards || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Max Nesting Depth</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.patternMatchingStats.maxNesting || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Nested Matches</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.patternMatchingStats.nestedMatches || 0}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Branch Density Metrics -->
                    <div class="w-full mb-8">
                        <div class="border-b">
                            <h3 class="px-2 text-lg font-semibold text-gray-900 mb-3">Branch Density Metrics</h3>
                        </div>
                        <table class="w-full table-auto border-collapse divide-y divide-gray-200 dark:divide-gray-700">
                            <tbody class="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Total Branches</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.branchDensityStats.branches || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">If/Else Count</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.branchDensityStats.ifCount || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Case Count</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.branchDensityStats.caseCount || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Loop Count</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.branchDensityStats.loopCount || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Catch Case Count</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.branchDensityStats.catchCaseCount || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Boolean Operators (&&, ||)</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${memberData.branchDensityStats.boolOpsCount || 0}</td>
                                </tr>
                                <tr class="border-t-2">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300 font-semibold">Branch Density per 100 LOC</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300 font-semibold">${memberData.branchDensityStats.densityPer100 ? memberData.branchDensityStats.densityPer100.toFixed(2) : '0.00'}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300 font-semibold">Boolean Ops per 100 LOC</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300 font-semibold">${memberData.branchDensityStats.boolOpsPer100 ? memberData.branchDensityStats.boolOpsPer100.toFixed(2) : '0.00'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                </div>

                <!-- Complexity Analysis -->
                <div class="min-w-[50%] w-[85%] mx-auto bg-blue-50 dark:bg-gray-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-blue-800 dark:text-gray-900 mb-3">Analysis</h3>
                    <div class="text-sm text-blue-700 dark:text-gray-900 py-2">
                        ${getMemberComplexityAnalysis(memberData)}
                    </div>
                </div>
        `;
		}

		// Keep file-details tab visible but switch focus to method-complexity tab
		switchTab('method-complexity');
	}

	// Open method complexity tab for a specific method
	function openMethodComplexityTab(methodName, methodData) {
		// Show the method complexity tab
		const methodComplexityTab = document.getElementById('method-complexity-tab');
		const methodComplexityTabName = document.getElementById('method-complexity-tab-name');

		if (methodComplexityTab) {
			methodComplexityTab.style.display = 'flex';
			methodComplexityTabName.textContent = `${methodName}: Complexity`;
		}

		// Update the content
		const methodComplexityPlaceholder = document.getElementById('method-complexity-placeholder');

		if (methodComplexityPlaceholder) {
			methodComplexityPlaceholder.innerHTML = `

                <!-- Method Signature -->
                <div class="text-center bg-gray-50 rounded-lg py-6">
                    <span class="font-mono text-md text-gray-700 dark:text-gray-300">${colorizeSignature(methodData.metadata.signature) || methodName}</span>
                </div>

                <!-- Metrics Data Tables wrapper -->
                <div class="grid grid-cols-1 md:grid-cols-2 justify-items-center justify-center gap-5 py-6 px-6">

                    <!-- Core Metrics -->
                    <div class="w-full mb-8">
                        
                        <div class="border-b">
                            <h3 class="px-2 text-lg font-semibold text-gray-900 mb-3">Core Metrics</h3>
                        </div>
                        <table class="w-full table-auto border-collapse h-fit divide-y divide-gray-200 dark:divide-gray-700">
                            <tbody class="px-2 bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700">Lines of Code</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.metadata.linesOfCode || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Cyclomatic Complexity</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.complexity || 1}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Nesting Depth</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.nestingDepth || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Access Modifier</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.metadata.accessModifier || 'public'}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Has Scaladoc</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${parseBoolean(methodData.hasScaladoc) ? 'Yes' : 'No'}</td>
                                </tr>
                                <tr class=" ">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Is Nested</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${parseBoolean(methodData.isNested) ? 'Yes' : 'No'}</td>
                                </tr>
                            </tbody>
                        </table>

                    </div>

                    <!-- Parameter Metrics -->
                    <div class="w-full mb-8">
                        <div class="border-b">
                            <h3 class="px-2 text-lg font-semibold text-gray-900 mb-3">Parameter Metrics</h3>
                        </div>
                        <table class="w-full table-auto border-collapse divide-y divide-gray-200 dark:divide-gray-700">
                            <tbody class="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Total Parameters</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.parameterStats.totalParams || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Parameter Lists</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.parameterStats.paramLists || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Implicit Parameters</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.parameterStats.implicitParams || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Implicit Parameter Lists</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.parameterStats.implicitParamLists || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Using Parameters</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.parameterStats.usingParams || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Using Parameter Lists</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.parameterStats.usingParamLists || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Default Parameters</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.parameterStats.defaultedParams || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">By-Name Parameters</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.parameterStats.byNameParams || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Vararg Parameters</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.parameterStats.varargParams || 0}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pattern Matching Metrics -->
                    <div class="w-full mb-8">
                        <div class="border-b">
                            <h3 class="px-2 text-lg font-semibold text-gray-900 mb-3">Pattern Matching Metrics</h3>
                        </div>
                        <table class="w-full table-auto border-collapse divide-y divide-gray-200 dark:divide-gray-700">
                            <tbody class="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Match Expressions</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.patternMatchingStats.matches || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Total Cases</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.patternMatchingStats.cases || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Guards</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.patternMatchingStats.guards || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Wildcards</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.patternMatchingStats.wildcards || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Max Nesting Depth</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.patternMatchingStats.maxNesting || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Nested Matches</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.patternMatchingStats.nestedMatches || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Avg Cases per Match</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.patternMatchingStats.avgCasesPerMatch ? methodData.patternMatchingStats.avgCasesPerMatch.toFixed(2) : '0.00'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Branch Density Metrics -->
                    <div class="w-full mb-8">
                        <div class="border-b">
                            <h3 class="px-2 text-lg font-semibold text-gray-900 mb-3">Branch Density Metrics</h3>
                        </div>
                        <table class="w-full table-auto border-collapse divide-y divide-gray-200 dark:divide-gray-700">
                            <tbody class="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Total Branches</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.branchDensityStats.branches || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">If/Else Count</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.branchDensityStats.ifCount || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Case Count</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.branchDensityStats.caseCount || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Loop Count</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.branchDensityStats.loopCount || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Catch Case Count</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.branchDensityStats.catchCaseCount || 0}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300">Boolean Operators (&&, ||)</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300">${methodData.branchDensityStats.boolOpsCount || 0}</td>
                                </tr>
                                <tr class="border-t-2">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300 font-semibold">Branch Density per 100 LOC</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300 font-semibold">${methodData.branchDensityStats.densityPer100 ? methodData.branchDensityStats.densityPer100.toFixed(2) : '0.00'}</td>
                                </tr>
                                <tr class="">
                                    <td class="py-2 pl-2 pr-4 text-gray-700 dark:text-gray-300 font-semibold">Boolean Ops per 100 LOC</td>
                                    <td class="py-2 pl-2 pr-4 text-right font-mono text-gray-700 dark:text-gray-300 font-semibold">${methodData.branchDensityStats.boolOpsPer100 ? methodData.branchDensityStats.boolOpsPer100.toFixed(2) : '0.00'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Complexity Analysis -->
                <div class="min-w-[50%] w-[85%] mx-auto bg-blue-50 dark:bg-gray-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-blue-800 dark:text-gray-900 mb-3">Analysis</h3>
                    <div class="text-sm text-blue-700 datk:text-gray-900 py-2">
                        ${getComplexityAnalysis(methodData)}
                    </div>
                </div>
        `;
		}

		// Keep file-details tab visible but switch focus to method-complexity tab
		// This allows both tabs to be visible simultaneously
		switchTab('method-complexity');
	}

	// Process metrics data
	const data = globalData;

	// Update page title and header with project info
	if (data.metadata) {
		const projectName = data.metadata.name || 'Project';
		const projectDescription = data.metadata.description || 'Comprehensive analysis of your Scala project';
		const projectVersion = data.metadata.version || '';

		document.getElementById('page-title').textContent = `Code Metrics Report: ${projectName}`;
		document.getElementById('project-title').textContent = `${projectName}`;
		document.getElementById('project-description').textContent = projectDescription;

		// Display version if available
		const versionElement = document.getElementById('project-version');
		if (projectVersion) {
			versionElement.textContent = `v${projectVersion}`;
		}
	}

	const formatBytes = (bytes) => {
		const KB = 1024;
		const MB = 1024 * 1024;
		var unit = 'bytes';
		if (bytes >= MB) return [(bytes / MB).toFixed(1), 'megabytes'];
		if (bytes >= KB) return [(bytes / KB).toFixed(1), 'kilobytes'];
		return [String(bytes), unit];
	};

	// Update summary cards from rollup data
	const projectRollup = data.rollup;
	document.getElementById('totalFiles').textContent = projectRollup.totalCount || 0;
	document.getElementById('totalLoc').textContent = projectRollup.coreStats.totalLoc || 0;
	document.getElementById('totalFunctions').textContent = projectRollup.coreStats.totalFunctions || 0;
	document.getElementById('publicFunctions').textContent = projectRollup.coreStats.totalPublicFunctions || 0;
	document.getElementById('scaladocCoverage').textContent = (projectRollup.scalaDocCoveragePercentage || 0).toFixed(1) + '%';
	document.getElementById('scaladocDetails').textContent = `${projectRollup.totalDocumentedPublicSymbols || 0}/${projectRollup.coreStats.totalPublicSymbols || 0} symbols`;
	document.getElementById('deprecatedSymbols').textContent = projectRollup.coreStats.totalDeprecatedSymbols || 0;
	document.getElementById('deprecationDensity').textContent = (projectRollup.deprecatedSymbolsDensityPercentage || 0).toFixed(1) + '%';
	document.getElementById('totalInlineMethods').textContent = projectRollup.inlineAndImplicitStats.inlineMethods || 0;
	const avgFileSizeBytes = formatBytes(projectRollup.averageFileSizeBytes || 0)
	document.getElementById('avgFileSize').textContent = avgFileSizeBytes[0];
	document.getElementById('avgFileSizeUnit').textContent = avgFileSizeBytes[1];
	document.getElementById('pubReturnTypeExplicitness').textContent = (projectRollup.publicReturnTypeExplicitness || 0).toFixed(1) + '%';
	document.getElementById('avgCyclomaticComplexity').textContent = (projectRollup.avgCyclomaticComplexity || 0).toFixed(1);
	document.getElementById('maxCyclomaticComplexity').textContent = projectRollup.maxCyclomaticComplexity || 0;
	document.getElementById('bdDensityPer100').textContent = (projectRollup.branchDensityStats.densityPer100 || 0).toFixed(1) + '%';
	document.getElementById('avgNestingDepth').textContent = (projectRollup.avgNestingDepth || 0).toFixed(1);
	document.getElementById('maxNestingDepth').textContent = (projectRollup.maxNestingDepth || 0).toFixed(1);


	// Prepare chart data from new structure
	const packageData = data.packageStats.map(p => ({
		package: p.metadata.name,
		public: p.rollup.coreStats.totalPublicFunctions,
		private: p.rollup.coreStats.totalPrivateFunctions
	}));

	// Collect all files from all packages (deduplicated by file name)
	const allFilesMap = new Map();
	data.packageStats.forEach(pkg => {
		if (pkg.fileStats) {
			pkg.fileStats.forEach(file => {
				const fileName = file.metadata.fileName;
				// deduplicate
				if (!allFilesMap.has(fileName)) {
					allFilesMap.set(fileName, {
						fileName: fileName,
						linesOfCode: file.metadata.linesOfCode,
						fileSizeBytes: file.metadata.fileSizeBytes
					});
				}
			});
		}
	});

	const allFiles = Array.from(allFilesMap.values());

	const locData = allFiles.map(f => ({
		file: f.fileName,
		value: f.linesOfCode
	}));

	const sizeData = allFiles.map(f => ({
		file: f.fileName,
		value: f.fileSizeBytes
	}));

	const visibilityData = [
		{label: 'Public Functions', value: projectRollup.coreStats.totalPublicFunctions || 0, color: '#10b981'},
		{label: 'Private Functions', value: projectRollup.coreStats.totalPrivateFunctions || 0, color: '#ef4444'}
	];

	// Render all charts
	renderCharts(packageData, locData, sizeData, visibilityData);

	// Render table rows
	renderTableRows(data);

	// Populate Info tab
	populateInfoTab(data);

	// Tooltip
	const tooltip = d3.select('#tooltip');

	function renderTableRows(data) {
		const tbody = document.getElementById('fileMetricsBody');
		tbody.innerHTML = ''; // Clear existing rows

		// Sort packages by name
		const sortedPackages = [...data.packageStats].sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));

		// Render each package and its files
		sortedPackages.forEach(pkg => {

			const packageName = pkg.metadata.name;
			const fileStats = pkg.fileStats ? [...pkg.fileStats].sort((a, b) => a.metadata.fileName.localeCompare(b.metadata.fileName)) : [];
			const pkgRollup = pkg.rollup;
			const totalLoc = pkgRollup.coreStats.totalLoc; //fileStats.reduce((sum, f) => sum + (f.metadata.linesOfCode || 0), 0);
			const totalFileSize = pkgRollup.coreStats.totalFileSizeBytes; // fileStats.reduce((sum, f) => sum + (f.metadata.fileSizeBytes || 0), 0);

			// Create package row
			const packageRow = document.createElement('tr');
			packageRow.className = 'bg-gray-50 hover:bg-gray-100 cursor-pointer package-row';

			// Create the package row HTML - note: don't escape packageName in data attributes
			packageRow.innerHTML = `
            <td class="py-4 px-3 whitespace-nowrap text-sm font-bold text-gray-700">
                <span class="flex flex-row items-center gap-1">
                    <button class="toggle-btn collapsed" data-package="${packageName.replace(/"/g, '&quot;')}">
                        <svg class="inline-block w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                    <svg xmlns="http://www.w3.org/2000/svg"
                    shape-rendering="geometricPrecision"
                    text-rendering="geometricPrecision"
                    image-rendering="optimizeQuality"
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    width="16"
                    height="16"
                    viewBox="0 0 512 479.16"><path fill="#C28F60" d="m0 431.82 366 47.34 139.66-90.53L507.59 44 184.93 0 0 83.91z"/><path fill="#AA7950" d="m507.59 44-142.87 89.47L0 83.91 184.93 0z"/><path fill="#D2A06D" d="m366.06 479.16-1.34-345.69L507.59 44 512 389.98z"/><path fill="#65472F" d="m249.76 8.84 105.69 14.41-151.29 90.4-.09 156.47-53.83-36.66-53.84 30.43 6.72-164.29z"/></svg>
                     ${escapeHtml(packageName)}
                </span>
            </td>
            <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-500">${totalLoc}</td>
            <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-500">${pkgRollup.coreStats.totalFunctions || 0}</td>
            <td class="py-4 px-3 whitespace-nowrap text-sm text-green-600">${pkgRollup.coreStats.totalPublicFunctions || 0}</td>
            <td class="py-4 px-3 whitespace-nowrap text-sm text-red-600">${pkgRollup.totalPrivateFunctions || 0}</td>
            <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-500">${totalFileSize}</td>
        `;

			// Set onclick handler AFTER innerHTML to avoid it being overwritten
			packageRow.onclick = () => togglePackage(packageName);

			tbody.appendChild(packageRow);

			// Create file rows (hidden by default)
			fileStats.forEach(file => {
				const fileRow = document.createElement('tr');
				fileRow.className = 'pl-4 hover:bg-gray-50 hidden';
				fileRow.setAttribute('data-parent', packageName);

				fileRow.innerHTML = `
                <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-700">
                    <span class="flex flex-row items-center gap-2 pl-2">
                         <svg xmlns="http://www.w3.org/2000/svg"
                         shape-rendering="geometricPrecision"
                         text-rendering="geometricPrecision"
                         image-rendering="optimizeQuality"
                         fill-rule="evenodd"
                         clip-rule="evenodd"
                         width="16"
                         height="16"
                         viewBox="0 0 464 511.863"><path fill="#666" fill-rule="nonzero" d="M231.822 132.778c1.2-5.152 6.352-8.357 11.505-7.158 5.153 1.2 8.357 6.352 7.158 11.505l-20.773 88.972c-1.199 5.153-6.352 8.358-11.504 7.158-5.153-1.199-8.358-6.352-7.158-11.505l20.772-88.972zm-32.519 71.317c3.972 3.477 4.377 9.521.9 13.493-3.478 3.973-9.521 4.377-13.494.9l-36.354-31.854c-3.972-3.477-4.377-9.521-.9-13.493.295-.336.606-.644.933-.927l36.321-31.826c3.973-3.478 10.016-3.073 13.494.899 3.477 3.973 3.072 10.016-.9 13.494l-28.14 24.656 28.14 24.658zm77.99 14.393c-3.972 3.477-10.016 3.073-13.493-.9-3.478-3.972-3.073-10.016.899-13.493l28.14-24.658-28.14-24.656c-3.972-3.478-4.377-9.521-.899-13.494 3.477-3.972 9.521-4.377 13.493-.899l36.318 31.826c.328.283.639.591.933.927 3.477 3.972 3.073 10.016-.899 13.493l-36.352 31.854z"/><path fill-rule="nonzero" d="M90.232 0h230.505a7.998 7.998 0 016.39 3.183l96.876 104.809a7.937 7.937 0 012.118 5.411h.041v346.065c0 28.566-23.829 52.395-52.395 52.395H90.232c-28.711 0-52.395-23.697-52.395-52.395V52.395C37.837 23.601 61.438 0 90.232 0zm240.235 30.272V81.11c.913 12.412 5.265 22.192 12.97 28.775 7.822 6.682 19.34 10.418 34.49 10.676v-.03h32.219v-4.052l-79.679-86.207zm79.679 106.253h-32.219v-.033h-.124c-19.111-.302-34.068-5.373-44.736-14.486-11.073-9.458-17.282-22.969-18.52-39.763l-.075-1.098V16.016H90.232c-20.032 0-36.378 16.346-36.378 36.379v407.073c0 19.897 16.467 36.378 36.378 36.378h283.535c19.804 0 36.379-16.574 36.379-36.378V136.525z"/><path fill="red" d="M21.123 259.247h421.753c11.618 0 21.124 9.525 21.124 21.124v163.863c0 11.599-9.526 21.124-21.124 21.124H21.123C9.526 465.358 0 455.853 0 444.234V280.371c0-11.619 9.506-21.124 21.123-21.124z"/><path fill="#fff" fill-rule="nonzero" d="M49.466 403.268l3.804-22.418c8.333 2.083 15.827 3.123 22.484 3.123 6.66 0 12.025-.27 16.102-.815v-6.792l-12.229-1.087c-11.05-.998-18.635-3.647-22.758-7.95-4.121-4.302-6.182-10.665-6.182-19.089 0-11.593 2.514-19.565 7.541-23.911 5.028-4.35 13.565-6.523 25.611-6.523 12.047 0 22.916 1.133 32.61 3.398l-3.397 21.738c-8.424-1.359-15.172-2.039-20.245-2.039s-9.375.226-12.907.68v6.657l9.782.952c11.865 1.178 20.063 4.008 24.591 8.492 4.531 4.484 6.795 10.71 6.795 18.682 0 5.706-.77 10.528-2.311 14.47-1.54 3.94-3.373 6.927-5.502 8.966-2.129 2.038-5.141 3.601-9.037 4.687-3.892 1.087-7.312 1.744-10.255 1.97-2.944.229-6.864.341-11.755.341-11.774 0-22.687-1.177-32.742-3.532zM188.66 380.44l2.038 22.828c-5.708 2.355-12.863 3.532-21.469 3.532-8.605 0-15.51-.905-20.72-2.718-5.207-1.81-9.306-4.665-12.294-8.558-2.99-3.895-5.073-8.47-6.25-13.725-1.178-5.251-1.766-11.73-1.766-19.427 0-7.7.588-14.2 1.766-19.499 1.177-5.298 3.26-9.895 6.25-13.791 5.796-7.518 16.44-11.276 31.928-11.276 3.441 0 7.496.341 12.159 1.018 4.666.68 8.132 1.518 10.396 2.514l-4.077 20.789c-5.887-1.268-11.276-1.903-16.167-1.903-4.892 0-8.289.454-10.19 1.359-1.904.905-2.856 2.718-2.856 5.436v35.597a53.364 53.364 0 0010.735 1.087c7.7 0 14.539-1.087 20.517-3.263zm32.81 24.322h-27.938l21.281-84.917h41.985l22.011 84.917h-28.671l-3.122-13.453h-22.42l-3.126 13.453zm12.858-58.83l-4.841 23.777h12.5l-4.704-23.777h-2.955zm92.491 58.83h-41.834v-84.917h27.174v63.178h18.247l-3.587 21.739zm30.379 0h-27.21l20.553-84.917h41.985l22.011 84.917h-28.671l-3.123-13.453h-22.42l-3.125 13.453zm12.858-58.83l-4.842 23.777h12.501l-4.705-23.777h-2.954z"/></svg>
                        <a href="#" class="file-link text-blue-600 hover:text-blue-800 hover:underline" data-filepath="${escapeHtml(file.metadata.filePath || file.metadata.fileName)}" onclick="showFileDetails('${escapeJson(packageName)}', '${escapeJson(file.metadata.fileName)}'); return false;">
                            ${escapeHtml(file.metadata.fileName)}
                        </a>
                    </span>
                </td>
                <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-500">${file.metadata.linesOfCode || 0}</td>
                <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-500">${file.rollup.coreStats.totalFunctions || 0}</td>
                <td class="py-4 px-3 whitespace-nowrap text-sm text-green-600">${file.rollup.coreStats.totalPublicFunctions || 0}</td>
                <td class="py-4 px-3 whitespace-nowrap text-sm text-red-600">${file.rollup.coreStats.totalPrivateFunctions || 0}</td>
                <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-500">${file.rollup.coreStats.totalFileSizeBytes || 0}</td>
            `;
				tbody.appendChild(fileRow);

				// Attach custom tooltip to file link
				const fileLink = fileRow.querySelector('.file-link');
				if (fileLink) {
					const filePath = file.metadata.filePath || file.metadata.fileName;
					addTooltip(fileLink, filePath);
				}
			});
		});
	}

	function escapeHtml(text) {
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, m => map[m]);
	}

	function escapeJson(text) {
		return text.replace(/\\/g, '\\\\')
			.replace(/'/g, "\\'")
			.replace(/"/g, '\\"');
	}

	function showFileDetails(packageName, fileName) {
		// Find the file in the global data - navigate through packages first
		let file = null;
		for (const pkg of globalData.packageStats) {
			if (pkg.metadata.name === packageName) {
				if (pkg.fileStats) {
					const fileData = pkg.fileStats.find(f => f.metadata.fileName === fileName);
					if (fileData) {
						// Combine header and rollup data for easier access
						file = {
							metadata: {...fileData.metadata},
							rollup: {...fileData.rollup},
							memberStats: fileData.memberStats,
							methodStats: fileData.methodStats
						};
						break;
					}
				}
			}
		}

		if (!file) {
			console.error('File not found:', packageName, fileName);
			return;
		}

		// Show the file details tab
		const fileDetailsTab = document.getElementById('file-details-tab');
		const fileDetailsTabName = document.getElementById('file-details-tab-name');
		fileDetailsTab.style.display = 'block';
		fileDetailsTabName.textContent = fileName;

		// Add tooltip to show file path
		// Remove any existing tooltip listeners first
		const newTabName = fileDetailsTabName.cloneNode(true);
		fileDetailsTabName.parentNode.replaceChild(newTabName, fileDetailsTabName);
		// Add tooltip with file path
		addTooltip(newTabName, file.metadata.filePath || fileName);

		// Populate Core Source File Metrics
		document.getElementById('fileLinesOfCode').textContent = file.metadata.linesOfCode || 0;
		document.getElementById('fileTotalFunctions').textContent = file.rollup.coreStats.totalFunctions || 0;
		document.getElementById('filePublicFunctions').textContent = file.rollup.coreStats.totalPublicFunctions || 0;
		document.getElementById('filePrivateFunctions').textContent = file.rollup.coreStats.totalPrivateFunctions || 0;
		document.getElementById('fileSize').textContent = (file.metadata.fileSizeBytes || 0) + ' bytes';

		// Populate Return Type Explicitness Metrics
		document.getElementById('totalDefsValsVars').textContent = file.rollup.coreStats.totalDefsValsVars || 0;
		document.getElementById('totalPublicDefsValsVars').textContent = file.rollup.coreStats.totalPublicDefsValsVars || 0;
		document.getElementById('explicitDefsValsVars').textContent = file.rollup.inlineAndImplicitStats.explicitDefsValsVars || 0;
		document.getElementById('explicitPublicDefsValsVars').textContent = file.rollup.inlineAndImplicitStats.explicitPublicDefsValsVars || 0;
		document.getElementById('returnTypeExplicitness').textContent =
			file.rollup.returnTypeExplicitness !== undefined ? file.rollup.returnTypeExplicitness.toFixed(2) + '%' : '-';
		document.getElementById('publicReturnTypeExplicitness').textContent =
			file.rollup.publicReturnTypeExplicitness !== undefined ? file.rollup.publicReturnTypeExplicitness.toFixed(2) + '%' : '-';

		// Populate Inline Usage Metrics (Scala 3)
		document.getElementById('fileInlineMethods').textContent = file.rollup.inlineAndImplicitStats.inlineMethods || 0;
		document.getElementById('fileInlineVals').textContent = file.rollup.inlineAndImplicitStats.inlineVals || 0;
		document.getElementById('fileInlineVars').textContent = file.rollup.inlineAndImplicitStats.inlineVars || 0;
		document.getElementById('fileInlineParams').textContent = file.rollup.inlineAndImplicitStats.inlineParams || 0;

		// Populate Implicit & Given Usage Metrics
		document.getElementById('fileImplicitDefs').textContent = file.rollup.inlineAndImplicitStats.implicitDefs || 0;
		document.getElementById('fileImplicitVals').textContent = file.rollup.inlineAndImplicitStats.implicitVals || 0;
		document.getElementById('fileImplicitVars').textContent = file.rollup.inlineAndImplicitStats.implicitVars || 0;
		document.getElementById('fileImplicitConversions').textContent = file.rollup.inlineAndImplicitStats.implicitConversions || 0;
		document.getElementById('fileGivenInstances').textContent = file.rollup.inlineAndImplicitStats.givenInstances || 0;
		document.getElementById('fileGivenConversions').textContent = file.rollup.inlineAndImplicitStats.givenConversions || 0;

		// Render member table
		renderMemberTable(file);

		// Render method table
		renderMethodTable(file);

		// Switch to the file details tab
		switchTab('file-details');
	}

	function colorizeSignature(signature) {
		// Don't try to colorize empty or very long signatures (prevent issues)
		if (!signature || signature.length > 500) {
			return escapeHtml(signature);
		}

		// Match method signature pattern: methodName(param1: Type1, param2: Type2): ReturnType
		const signaturePattern = /^([a-zA-Z_][a-zA-Z0-9_]*)(.*?)$/;
		const match = signature.match(signaturePattern);

		if (!match) return escapeHtml(signature);

		const methodName = match[1];
		const rest = match[2];

		// Build result using array for better performance
		const parts = [];
		parts.push(`<span class="text-purple-700 font-semibold">${escapeHtml(methodName)}</span>`);

		// Process the rest character by character
		let i = 0;
		while (i < rest.length) {
			const char = rest[i];

			if (char === '(' || char === ')' || char === '[' || char === ']') {
				parts.push(`<span class="text-gray-500">${escapeHtml(char)}</span>`);
				i++;
			} else if (char === ',' || char === ':') {
				parts.push(`<span class="text-gray-500">${escapeHtml(char)}</span>`);
				i++;
			} else if (char === ' ') {
				parts.push(' ');
				i++;
			} else if (char === '<' || char === '>' || char === '&') {
				// Handle special chars that might break parsing
				parts.push(escapeHtml(char));
				i++;
			} else {
				// Collect identifier/type name
				let identifier = '';
				let safetyCounter = 0;
				while (i < rest.length && safetyCounter < 100) {
					if (/[a-zA-Z0-9_\.]/.test(rest[i])) {
						identifier += rest[i];
						i++;
						safetyCounter++;
					} else {
						break;
					}
				}

				if (identifier) {
					// Check if this looks like a type (starts with uppercase or contains dot)
					const isType = /^[A-Z]/.test(identifier) || identifier.includes('.');
					if (isType) {
						parts.push(`<span class="text-teal-600">${escapeHtml(identifier)}</span>`);
					} else {
						parts.push(`<span class="text-gray-700">${escapeHtml(identifier)}</span>`);
					}
				} else {
					// Safety: if we couldn't collect an identifier, skip this char
					parts.push(escapeHtml(char));
					i++;
				}
			}
		}

		return parts.join('');
	}

	function renderMemberTable(file) {
		const tbody = document.getElementById('fileMembersBody');
		tbody.innerHTML = '';

		// Update title
		document.getElementById('file-members-title').textContent = `Members in ${file.metadata.fileName}`;

		// Check if there are members
		if (!file.memberStats || file.memberStats.length === 0) {
			const row = document.createElement('tr');
			row.innerHTML = `
            <td colspan="6" class="py-4 px-3 text-center text-sm text-gray-500">
                No members found in this file
            </td>
        `;
			tbody.appendChild(row);
			return;
		}

		// Sort members by LOC descending
		const sortedMembers = [...file.memberStats].sort((a, b) => b.metadata.linesOfCode - a.metadata.linesOfCode);

		// Render each member
		sortedMembers.forEach(member => {
			const row = document.createElement('tr');
			row.className = 'pl-4 hover:bg-gray-50';

			const accessColor = member.metadata.accessModifier === 'public' ? 'green-600' :
				member.metadata.accessModifier === 'private' ? 'red-600' : 'yellow-600';

			const colorizedSignature = colorizeSignature(member.metadata.signature);

			const memberHasScaladoc = parseBoolean(member.hasScaladoc);
			const scalaDocIndicator = memberHasScaladoc ?
				`<svg class="inline-block w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>` :
				`<svg class="inline-block w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>`;

			// Define colors for member types
			const typeColorMap = {
				'class': 'blue-600',
				'trait': 'indigo-600',
				'object': 'purple-600',
				'val': 'teal-600',
				'var': 'orange-600',
				'type': 'pink-600'
			};
			const typeColor = typeColorMap[member.metadata.declarationType] || 'gray-600';

			// Extract member name for the click handler
			const memberName = extractMethodName(member.metadata.signature);

			row.innerHTML = `
            <td class="py-4 px-4 text-sm font-mono">
                <a href="#" class="hover:underline cursor-pointer" onclick="openMemberComplexityTab('${escapeJson(memberName)}', ${JSON.stringify(member).replace(/"/g, '&quot;')}); return false;">${colorizedSignature}</a>
            </td>
            <td class="py-4 px-3 whitespace-nowrap text-sm font-semibold text-${typeColor}">
                ${member.metadata.declarationType}
            </td>
            <td class="py-4 px-3 whitespace-nowrap text-sm font-semibold text-${accessColor}">
                ${member.metadata.accessModifier}
            </td>
            <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-500 font-bold">
                ${member.metadata.linesOfCode}
            </td>
            <td class="py-4 px-3 whitespace-nowrap text-center">
                ${scalaDocIndicator}
            </td>
            <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-500 font-bold">
                ${member.complexity !== undefined ? member.complexity : '-'}
            </td>
        `;
			tbody.appendChild(row);
		});
	}

	function renderMethodTable(file) {
		const tbody = document.getElementById('fileMethodsBody');
		tbody.innerHTML = '';

		// Update title
		document.getElementById('file-details-title').textContent = `Methods in ${file.metadata.fileName}`;

		// Check if methods exist
		if (!file.methodStats || file.methodStats.length === 0) {
			const row = document.createElement('tr');
			row.innerHTML = `
            <td colspan="5" class="py-4 px-3 text-center text-sm text-gray-500">
                No methods found in this file
            </td>
        `;
			tbody.appendChild(row);
			return;
		}

		// Sort methods by LOC descending
		const sortedMethods = [...file.methodStats].sort((a, b) => b.metadata.linesOfCode - a.metadata.linesOfCode);

		// Render each method
		sortedMethods.forEach(method => {
			const row = document.createElement('tr');
			row.className = 'hover:bg-gray-50';

			// Convert string "true"/"false" to actual boolean
			const isNested = parseBoolean(method.metadata.isNested);

			// Determine access display text and color
			let accessText, accessColor;
			if (isNested) {
				accessText = 'nested';
				accessColor = 'purple-600';
			} else {
				accessText = method.metadata.accessModifier;
				accessColor = method.metadata.accessModifier === 'public' ? 'green-600' :
					method.metadata.accessModifier === 'private' ? 'red-600' : 'yellow-600';
			}

			const nestedIndicator = isNested ?
				`<svg class="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>` : '';

			const colorizedSignature = colorizeSignature(method.metadata.signature);

			const methodHasScaladoc = parseBoolean(method.hasScaladoc);
			const scalaDocIndicator = methodHasScaladoc ?
				`<svg class="inline-block w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>` :
				`<svg class="inline-block w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>`;

			// Extract method name for the click handler
			const methodName = extractMethodName(method.metadata.signature);

			row.innerHTML = `
            <td class="py-4 px-4 text-sm font-mono">
                ${nestedIndicator}<a href="#" class="hover:underline cursor-pointer" onclick="openMethodComplexityTab('${escapeJson(methodName)}', ${JSON.stringify(method).replace(/"/g, '&quot;')}); return false;">${colorizedSignature}</a>
            </td>
            <td class="py-4 px-3 whitespace-nowrap text-sm font-semibold text-${accessColor}">
                ${accessText}
            </td>
            <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-500 font-bold">
                ${method.metadata.linesOfCode}
            </td>
            <td class="py-4 px-3 whitespace-nowrap text-center">
                ${scalaDocIndicator}
            </td>
            <td class="py-4 px-3 whitespace-nowrap text-sm text-gray-500 font-bold">
                ${method.complexity !== undefined ? method.complexity : 1}
            </td>
        `;
			tbody.appendChild(row);
		});
	}

	function populateInfoTab(data) {
		const tbodyBasic = document.getElementById('info-table-basic').querySelector('tbody');
		const tbodyExtended = document.getElementById('info-table-extended').querySelector('tbody');
		tbodyBasic.innerHTML = '';
		tbodyExtended.innerHTML = '';

		// Helper function to create a table row
		function createRow(label, value, isLink = false, isArray = false) {
			const row = document.createElement('tr');
			row.className = 'hover:bg-gray-100 dark:hover:bg-gray-700';

			const labelCell = document.createElement('td');
			labelCell.className = 'py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap';
			labelCell.textContent = label;

			const valueCell = document.createElement('td');
			valueCell.className = 'py-4 px-6 text-sm text-gray-700 dark:text-gray-300';

			if (isLink) {
				const link = document.createElement('a');
				link.href = value;
				link.target = '_blank';
				link.className = 'text-blue-600 dark:text-blue-600 hover:underline';
				link.textContent = value;
				valueCell.appendChild(link);
			} else if (isArray && Array.isArray(value)) {
				const ul = document.createElement('ul');
				ul.className = 'list-disc list-inside';
				value.forEach(item => {
					const li = document.createElement('li');
					li.textContent = item;
					ul.appendChild(li);
				});
				valueCell.appendChild(ul);
			} else {
				valueCell.textContent = value;
			}

			row.appendChild(labelCell);
			row.appendChild(valueCell);
			return row;
		}

		// Basic table fields - all from header now
		const basicFields = [
			{key: 'name', label: 'Project Name'},
			{key: 'description', label: 'Description'},
			{key: 'version', label: 'Version'},
			{key: 'organization', label: 'Organization'},
			{key: 'organizationName', label: 'Organization Name'},
			{key: 'scalaVersion', label: 'Scala Version'},
			{key: 'crossScalaVersions', label: 'Cross Scala Versions'},
			{key: 'licenses', label: 'License'}
		];

		// Extended table fields
		const extendedFields = [
			{key: 'projectInfoNameFormal', label: 'Formal Name'},
			{key: 'homepage', label: 'Project Homepage', isLink: true},
			{key: 'apiURL', label: 'API Documentation', isLink: true},
			{key: 'organizationHomepage', label: 'Organization Homepage', isLink: true},
			{key: 'developers', label: 'Developers', isArray: true},
			{key: 'isSnapshot', label: 'Is Snapshot'},
			{key: 'versionScheme', label: 'Version Scheme'},
			{key: 'scmInfo', label: 'Source Repository (scm)'},
			{key: 'startYear', label: 'Start Year'}
		];

		// Add rows for basic fields from header
		basicFields.forEach(field => {
			if (data.metadata && data.metadata[field.key] && String(data.metadata[field.key]).trim() !== '') {
				tbodyBasic.appendChild(createRow(field.label, data.metadata[field.key], field.isLink || false, field.isArray || false));
			}
		});

		// Add rows for extended fields from header
		extendedFields.forEach(field => {
			if (data.metadata && data.metadata[field.key] && String(data.metadata[field.key]).trim() !== '') {
				tbodyExtended.appendChild(createRow(field.label, data.metadata[field.key], field.isLink || false, field.isArray || false));
			}
		});
	}

	function createHeatmapChart() {

		const bins = [
			{key: "0–1", min: 0, max: 1},
			{key: "2–3", min: 2, max: 3},
			{key: "4–5", min: 4, max: 5},
			{key: "6–8", min: 6, max: 8},
			{key: "9–12", min: 9, max: 12},
			{key: "13–20", min: 13, max: 20},
			{key: "21+", min: 21, max: Infinity}
		];
		const binByValue = (v) => bins.find(b => v >= b.min && v <= b.max).key;

		function* iterateMethods(root) {
			const packages = root.packageStats || [];
			for (const pkg of packages) {
				const files = (pkg.fileStats || []);
				for (const f of files) {
					const pkgName =
						(f.metadata && f.metadata.packageName) ||
						(pkg.rollup && pkg.metadata.name) ||
						'(unknown)';
					const methods = f.methodStats || [];
					for (const m of methods) {
						const cc = Number(m.complexity || 0);
						yield {
							package: pkgName,
							file: (f.metadata && f.metadata.fileName) || '(file)',
							name: m.metadata.name || '(method)',
							complexity: isFinite(cc) ? cc : 0
						};
					}
				}
			}
		}

		const methods = Array.from(iterateMethods(data));

		// Build matrix: package x bin -> count
		const pkgs = Array.from(new Set(methods.map(d => d.package))).sort();
		const cols = bins.map(b => b.key);
		const counts = new Map(); // key: package|bin -> count
		const packageTotals = new Map(); // package -> total functions

		for (const pkg of pkgs) {
			for (const col of cols) counts.set(pkg + '|' + col, 0);
			packageTotals.set(pkg, 0);
		}

		for (const m of methods) {
			const bk = binByValue(m.complexity);
			counts.set(m.package + '|' + bk, counts.get(m.package + '|' + bk) + 1);
			packageTotals.set(m.package, packageTotals.get(m.package) + 1);
		}

		// SVG layout
		const svg = d3.select('#chart');
		const margin = {top: 70, right: 16, bottom: 28, left: 280};
		const width = +svg.attr('width');
		const height = +svg.attr('height');

		const innerW = width - margin.left - margin.right;
		const innerH = height - margin.top - margin.bottom;

		// dynamic cell sizes based on row count
		const rowHeight = Math.max(16, Math.min(28, innerH / Math.max(pkgs.length, 1)));
		const colWidth = Math.max(50, innerW / cols.length);

		svg.attr('height', margin.top + margin.bottom + rowHeight * pkgs.length);

		const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Scales
		const y = d3.scaleBand().domain(pkgs).range([0, rowHeight * pkgs.length]).padding(0.12);
		const x = d3.scaleBand().domain(cols).range([0, colWidth * cols.length]).padding(0.06);

		const maxCount = d3.max(pkgs, p => d3.max(cols, c => counts.get(p + '|' + c))) || 1;
		const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxCount]); // low→high

		// Axes
		const xAxis = d3.axisTop(x).tickSize(0);
		const yAxis = d3.axisLeft(y).tickSize(0);

		g.append('g').attr('class', 'axis x').call(xAxis)
			.selectAll('text')
			.style('text-anchor', 'middle')
			.style('cursor', 'pointer')
			.on('click', (_, d) => toggleSortByColumn(d));

		g.append('g').attr('class', 'axis y').call(yAxis)
			.selectAll('text')
			.style('cursor', 'pointer')
			.on('click', (_, d) => isolatePackage(d));

		// grid lines (optional subtle)
		g.append('g')
			.selectAll('line.row')
			.data(pkgs)
			.enter().append('line')
			.attr('x1', 0).attr('x2', x.range()[1])
			.attr('y1', d => y(d) + y.bandwidth()).attr('y2', d => y(d) + y.bandwidth())
			.attr('stroke', 'rgba(255,255,255,0.06)');

		// Cells
		const tooltip = d3.select('#heatmap-tooltip');

		function renderCells() {
			const cells = g.selectAll('rect.cell')
				.data(pkgs.flatMap(p => cols.map(c => ({p, c, v: counts.get(p + '|' + c)}))));

			cells.enter().append('rect')
				.attr('class', 'cell')
				.attr('rx', 3).attr('ry', 3)
				.attr('x', d => x(d.c))
				.attr('y', d => y(d.p))
				.attr('width', x.bandwidth())
				.attr('height', y.bandwidth())
				.attr('fill', d => color(d.v))
				.on('mousemove', (event, d) => {
					tooltip.style('opacity', 1)
						.style('left', event.clientX + 'px')
						.style('top', event.clientY + 'px')
						.html(`
                <div><strong>${d.p}</strong></div>
                <div>Bin: <strong>${d.c}</strong></div>
                <div>Functions: <strong>${d.v}</strong></div>
                <div>Total in package: ${packageTotals.get(d.p)}</div>
              `);
				})
				.on('mouseleave', () => tooltip.style('opacity', 0))
				.merge(cells)
				.transition().duration(300)
				.attr('x', d => x(d.c))
				.attr('y', d => y(d.p))
				.attr('width', x.bandwidth())
				.attr('height', y.bandwidth())
				.attr('fill', d => color(d.v));

			cells.exit().remove();
		}

		renderCells();

		// Legend
		const legend = d3.select('#legend');
		const legendSteps = 6;
		const stops = d3.range(legendSteps + 1).map(i => Math.round(i * maxCount / legendSteps));
		legend.html('');
		legend.append('span').text('Count');
		stops.forEach(s => {
			const sw = document.createElement('span');
			sw.className = 'swatch';
			sw.style.background = color(s);
			legend.node().appendChild(sw);
		});
		legend.append('span').text(`0 → ${maxCount}`);

		// Sorting & interactions
		let sortMode = 'total'; // 'alpha' | 'total' - default to 'total'
		let sortDirCol = +1;    // for per-column toggle

		document.getElementById('sort-alpha').addEventListener('click', () => {
			sortMode = 'alpha';
			document.getElementById('sort-alpha').setAttribute('aria-pressed', 'true');
			document.getElementById('sort-total').setAttribute('aria-pressed', 'false');
			sortRows();
		});
		document.getElementById('sort-total').addEventListener('click', () => {
			sortMode = 'total';
			document.getElementById('sort-alpha').setAttribute('aria-pressed', 'false');
			document.getElementById('sort-total').setAttribute('aria-pressed', 'true');
			sortRows();
		});

		function sortRows(refColumnKey = null) {
			let order;
			if (sortMode === 'alpha') {
				order = d3.sort(pkgs, d3.ascending);
			} else {
				// sort by total, or if a column is clicked: by that column counts
				order = pkgs.slice().sort((a, b) => {
					const va = refColumnKey ? counts.get(a + "|" + refColumnKey) : packageTotals.get(a);
					const vb = refColumnKey ? counts.get(b + "|" + refColumnKey) : packageTotals.get(b);
					return d3.descending(va, vb);
				});
			}
			y.domain(order);
			svg.select('.axis.y').transition().duration(250).call(yAxis);
			g.selectAll('rect.cell')
				.transition().duration(250)
				.attr('y', d => y(d.p));
			g.selectAll('line.row')
				.transition().duration(250)
				.attr('y1', d => y(d) + y.bandwidth())
				.attr('y2', d => y(d) + y.bandwidth());
		}

		function toggleSortByColumn(colKey) {
			// toggle direction on each click
			sortDirCol *= -1;
			const ordered = pkgs.slice().sort((a, b) => {
				const va = counts.get(a + "|" + colKey);
				const vb = counts.get(b + "|" + colKey);
				return (sortDirCol === 1) ? d3.ascending(va, vb) : d3.descending(va, vb);
			});
			y.domain(ordered);
			svg.select('.axis.y').transition().duration(250).call(yAxis);
			g.selectAll('rect.cell')
				.transition().duration(250)
				.attr('y', d => y(d.p));
			g.selectAll('line.row')
				.transition().duration(250)
				.attr('y1', d => y(d) + y.bandwidth())
				.attr('y2', d => y(d) + y.bandwidth());
		}

		function isolatePackage(pkgName) {
			// simple highlight: move the selected row on top by reordering domain
			const others = pkgs.filter(p => p !== pkgName);
			y.domain([pkgName, ...others]);
			svg.select('.axis.y').transition().duration(250).call(yAxis);
			g.selectAll('rect.cell')
				.transition().duration(250)
				.attr('y', d => y(d.p));
			g.selectAll('line.row')
				.transition().duration(250)
				.attr('y1', d => y(d) + y.bandwidth())
				.attr('y2', d => y(d) + y.bandwidth());
		}

		// Initial sort by A→Z (default button state)
		sortRows();

	}

	function createFunctionsPerPackageChart(packageData) {
		// Functions per Package Stacked Bar Chart
		// Dynamically calculate bottom margin based on longest package name
		const maxPkgNameLength = Math.max(...packageData.map(d => d.package.length));
		const dynamicBottomMargin = Math.min(200, Math.max(120, maxPkgNameLength * 4));
		const margin = {top: 20, right: 140, bottom: dynamicBottomMargin, left: 60};

		// Fixed bar width - no calculation, just a constant value
		const pkgBarWidth = 60;

		// Calculate chart width based on actual number of packages using the fixed bar width
		// The 0.9 factor accounts for the padding between bars (D3's paddingInner)
		const pkgChartWidth = Math.max(400, packageData.length * pkgBarWidth / 0.9 + margin.left + margin.right);
		const pkgWidth = pkgChartWidth - margin.left - margin.right;
		const pkgHeight = 400 - margin.top - margin.bottom;

		// Set the container div to have explicit width to enable scrolling
		d3.select('#packageChart')
			.style('width', pkgChartWidth + 'px')
			.style('min-width', pkgChartWidth + 'px');

		const pkgSvg = d3.select('#packageChart')
			.append('svg')
			.attr('width', pkgChartWidth)
			.attr('height', pkgHeight + margin.top + margin.bottom)
			.style('display', 'block')
			.style('margin', '0 auto')
			.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		const x0 = d3.scaleBand()
			.domain(packageData.map(d => d.package))
			.rangeRound([0, pkgWidth])
			.paddingInner(0.1);

		const y = d3.scaleLinear()
			.domain([0, d3.max(packageData, d => d.public + d.private)])
			.nice()
			.rangeRound([pkgHeight, 0]);

		const stack = d3.stack()
			.keys(['public', 'private']);

		const series = stack(packageData);

		const colorScale = d3.scaleOrdinal()
			.domain(['public', 'private'])
			.range(['#10b981', '#ef4444']);

		// Add horizontal grid lines
		pkgSvg.append('g')
			.attr('class', 'grid')
			.call(d3.axisLeft(y)
				.tickSize(-pkgWidth)
				.tickFormat('')
			)
			.style('stroke-dasharray', '3 3')
			.style('opacity', 0.3);

		pkgSvg.append('g')
			.selectAll('g')
			.data(series)
			.enter()
			.append('g')
			.attr('fill', d => colorScale(d.key))
			.selectAll('rect')
			.data(d => d)
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', d => x0(d.data.package))
			.attr('y', d => y(d[1]))
			.attr('height', d => y(d[0]) - y(d[1]))
			.attr('width', x0.bandwidth())
			.on('mouseover', function (event, d) {
				const key = d3.select(this.parentNode).datum().key;
				tooltip.style('opacity', 1)
					.html(d.data.package + '<br>' + (key === 'public' ? 'Public' : 'Private') + ': ' + (d[1] - d[0]))
					.style('left', (event.pageX + 10) + 'px')
					.style('top', (event.pageY - 10) + 'px');
			})
			.on('mouseout', () => tooltip.style('opacity', 0));

		pkgSvg.append('g')
			.attr('class', 'axis')
			.attr('transform', 'translate(0,' + pkgHeight + ')')
			.call(d3.axisBottom(x0))
			.selectAll('text')
			.attr('transform', 'rotate(-45)')
			.style('text-anchor', 'end');

		pkgSvg.append('g')
			.attr('class', 'axis')
			.call(d3.axisLeft(y));

		// Legend
		const pkgLegend = pkgSvg.append('g')
			.attr('transform', 'translate(' + (pkgWidth + 20) + ', 0)');

		['public', 'private'].forEach((key, i) => {
			const lg = pkgLegend.append('g')
				.attr('transform', 'translate(0, ' + (i * 25) + ')');
			lg.append('rect')
				.attr('width', 18)
				.attr('height', 18)
				.attr('fill', colorScale(key));
			lg.append('text')
				.attr('x', 25)
				.attr('y', 9)
				.attr('dy', '.35em')
				.attr('class', 'chart-legend-text')
				.style('font-size', '12px')
				.text(key === 'public' ? 'Public Functions' : 'Private Functions');
		});

	}

	function createLinesOfCodeChart(locData) {
		// Lines of Code per File Bar Chart
		// Dynamically calculate bottom margin based on longest package name
		const maxPkgNameLength = Math.max(...packageData.map(d => d.package.length));
		const dynamicBottomMargin = Math.min(200, Math.max(120, maxPkgNameLength * 4));
		const margin = {top: 20, right: 140, bottom: dynamicBottomMargin, left: 60};
		// Fixed bar width - same as package chart
		const locBarWidth = 60;
		const pkgHeight = 400 - margin.top - margin.bottom;

		// Calculate chart width based on actual number of files using the fixed bar width
		// The 0.9 factor accounts for the padding between bars (D3's paddingInner)
		const locChartWidth = Math.max(800, locData.length * locBarWidth / 0.9 + margin.left + margin.right);
		const locWidth = locChartWidth - margin.left - margin.right;

		// Set the container div to have explicit width to enable scrolling
		d3.select('#locChart')
			.style('width', locChartWidth + 'px')
			.style('min-width', locChartWidth + 'px');

		const locSvg = d3.select('#locChart')
			.append('svg')
			.attr('width', locChartWidth)
			.attr('height', pkgHeight + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		const xLoc = d3.scaleBand()
			.domain(locData.map(d => d.file))
			.rangeRound([0, locWidth])
			.padding(0.1);

		const yLoc = d3.scaleLinear()
			.domain([0, d3.max(locData, d => d.value)])
			.nice()
			.rangeRound([pkgHeight, 0]);

		// Add horizontal grid lines
		locSvg.append('g')
			.attr('class', 'grid')
			.call(d3.axisLeft(yLoc)
				.tickSize(-locWidth)
				.tickFormat('')
			)
			.style('stroke-dasharray', '3 3')
			.style('opacity', 0.3);

		locSvg.selectAll('.bar')
			.data(locData)
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', d => xLoc(d.file))
			.attr('y', d => yLoc(d.value))
			.attr('width', xLoc.bandwidth())
			.attr('height', d => pkgHeight - yLoc(d.value))
			.attr('fill', '#3b82f6')
			.on('mouseover', function (event, d) {
				tooltip.style('opacity', 1)
					.html(d.file + '<br>Lines of Code: ' + d.value)
					.style('left', (event.pageX + 10) + 'px')
					.style('top', (event.pageY - 10) + 'px');
			})
			.on('mouseout', () => tooltip.style('opacity', 0));

		locSvg.append('g')
			.attr('class', 'axis')
			.attr('transform', 'translate(0,' + pkgHeight + ')')
			.call(d3.axisBottom(xLoc))
			.selectAll('text')
			.attr('transform', 'rotate(-45)')
			.style('text-anchor', 'end');

		locSvg.append('g')
			.attr('class', 'axis')
			.call(d3.axisLeft(yLoc));
	}

	function createFileSizeDistributionChart(sizeData) {
		// File Size Distribution Bar Chart
		// Dynamically calculate bottom margin based on longest package name
		const maxPkgNameLength = Math.max(...packageData.map(d => d.package.length));
		const dynamicBottomMargin = Math.min(200, Math.max(120, maxPkgNameLength * 4));
		const margin = {top: 20, right: 140, bottom: dynamicBottomMargin, left: 60};
		// Fixed bar width - same as package and LOC charts
		const sizeBarWidth = 60;
		const pkgHeight = 400 - margin.top - margin.bottom;

		// Calculate chart width based on actual number of files using the fixed bar width
		// The 0.9 factor accounts for the padding between bars (D3's paddingInner)
		const sizeChartWidth = Math.max(800, sizeData.length * sizeBarWidth / 0.9 + margin.left + margin.right);
		const sizeWidth = sizeChartWidth - margin.left - margin.right;

		// Set the container div to have explicit width to enable scrolling
		d3.select('#fileSizeChart')
			.style('width', sizeChartWidth + 'px')
			.style('min-width', sizeChartWidth + 'px');

		const sizeSvg = d3.select('#fileSizeChart')
			.append('svg')
			.attr('width', sizeChartWidth)
			.attr('height', pkgHeight + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		const xSize = d3.scaleBand()
			.domain(sizeData.map(d => d.file))
			.rangeRound([0, sizeWidth])
			.padding(0.1);

		const ySize = d3.scaleLinear()
			.domain([0, d3.max(sizeData, d => d.value)])
			.nice()
			.rangeRound([pkgHeight, 0]);

		// Add horizontal grid lines
		sizeSvg.append('g')
			.attr('class', 'grid')
			.call(d3.axisLeft(ySize)
				.tickSize(-sizeWidth)
				.tickFormat('')
			)
			.style('stroke-dasharray', '3 3')
			.style('opacity', 0.3);

		sizeSvg.selectAll('.bar')
			.data(sizeData)
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', d => xSize(d.file))
			.attr('y', d => ySize(d.value))
			.attr('width', xSize.bandwidth())
			.attr('height', d => pkgHeight - ySize(d.value))
			.attr('fill', '#8b5cf6')
			.on('mouseover', function (event, d) {
				tooltip.style('opacity', 1)
					.html(d.file + '<br>File Size: ' + d.value + ' bytes')
					.style('left', (event.pageX + 10) + 'px')
					.style('top', (event.pageY - 10) + 'px');
			})
			.on('mouseout', () => tooltip.style('opacity', 0));

		sizeSvg.append('g')
			.attr('class', 'axis')
			.attr('transform', 'translate(0,' + pkgHeight + ')')
			.call(d3.axisBottom(xSize))
			.selectAll('text')
			.attr('transform', 'rotate(-45)')
			.style('text-anchor', 'end');

		sizeSvg.append('g')
			.attr('class', 'axis')
			.call(d3.axisLeft(ySize));
	}

	function renderCharts(packageData, locData, sizeData) {
		createHeatmapChart();
		createFunctionsPerPackageChart(packageData);
		createLinesOfCodeChart(locData);
		createFileSizeDistributionChart(sizeData);
	}

	// Helper function to convert JSON boolean strings to actual booleans
	function parseBoolean(value) {
		return value === "true" || value === true;
	}

	// Custom Tooltip Management
	const customTooltip = {
		element: null,
		textElement: null,

		init() {
			this.element = document.getElementById('custom-tooltip');
			this.textElement = document.getElementById('custom-tooltip-text');
		},

		show(text, event) {
			if (!this.element || !this.textElement) this.init();

			this.textElement.textContent = text;
			this.element.classList.remove('hidden');
			this.updatePosition(event);
		},

		hide() {
			if (!this.element) return;
			this.element.classList.add('hidden');
		},

		updatePosition(event) {
			if (!this.element) return;

			// Force the tooltip to render so we can get its dimensions
			const tooltipWidth = this.element.offsetWidth || 150; // Default width if not rendered
			const tooltipHeight = this.element.offsetHeight || 40; // Default height
			const offset = 12;
			const padding = 10;

			// Use clientX/clientY for viewport-relative positioning
			let left = event.clientX - tooltipWidth / 2;
			let top = event.clientY - tooltipHeight - offset;

			// Boundary checking against viewport
			const minLeft = padding;
			const maxLeft = window.innerWidth - tooltipWidth - padding;
			const minTop = padding;
			const maxTop = window.innerHeight - tooltipHeight - padding;

			// Constrain horizontal position
			left = Math.max(minLeft, Math.min(left, maxLeft));

			// If tooltip would go above viewport, show it below cursor instead
			if (top < minTop) {
				top = event.clientY + offset;
			}

			// If tooltip would go below viewport, keep it above
			if (top > maxTop) {
				top = event.clientY - tooltipHeight - offset;
			}

			this.element.style.left = left + 'px';
			this.element.style.top = top + 'px';
		}
	};

	// Helper function to add tooltip to an element
	function addTooltip(element, tooltipText) {
		element.addEventListener('mouseenter', (e) => {
			customTooltip.show(tooltipText, e);
		});

		element.addEventListener('mousemove', (e) => {
			customTooltip.updatePosition(e);
		});

		element.addEventListener('mouseleave', () => {
			customTooltip.hide();
		});
	}

	// Helper function to escape strings for use in CSS attribute selectors
	function escapeAttributeSelector(value) {
		// Escape special CSS characters including dots, backslashes, and quotes
		// In CSS attribute selectors, dots don't need escaping, but we need to escape backslashes and quotes
		return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	}

	// File metrics tree functions
	function togglePackage(packagePath) {
		const escapedPath = escapeAttributeSelector(packagePath);
		const children = document.querySelectorAll(`[data-parent="${escapedPath}"]`);
		const toggleBtn = document.querySelector(`[data-package="${escapedPath}"]`);

		if (!toggleBtn) {
			console.error('Toggle button not found for package:', packagePath);
			return;
		}

		const isCollapsed = toggleBtn.classList.contains('collapsed');

		children.forEach(child => {
			if (isCollapsed) {
				child.classList.remove('hidden');
			} else {
				child.classList.add('hidden');
				// Also collapse any nested packages
				const childPackage = child.getAttribute('data-package');
				if (childPackage) {
					const childBtn = child.querySelector('.toggle-btn');
					if (childBtn && !childBtn.classList.contains('collapsed')) {
						togglePackage(childPackage);
					}
				}
			}
		});

		toggleBtn.classList.toggle('collapsed');
	}

	function toggleExpandCollapse() {
		const btn = document.getElementById('toggleExpandBtn');
		const allCollapsed = document.querySelectorAll('.toggle-btn.collapsed');

		// If there are any collapsed packages, expand all
		if (allCollapsed.length > 0) {
			allCollapsed.forEach(toggleBtn => {
				const packagePath = toggleBtn.getAttribute('data-package');
				togglePackage(packagePath);
			});
			btn.textContent = 'Collapse All';
		} else {
			// Otherwise, collapse all
			document.querySelectorAll('.toggle-btn:not(.collapsed)').forEach(toggleBtn => {
				const packagePath = toggleBtn.getAttribute('data-package');
				togglePackage(packagePath);
			});
			btn.textContent = 'Expand All';
		}
	}

	// Table sorting functionality
	let fileMetricsSortState = {column: 0, ascending: true};
	let membersSortState = {column: 3, ascending: false};
	let methodsSortState = {column: 2, ascending: false};

	function updateSortIcons(tableId, columnIndex, ascending) {
		const table = document.getElementById(tableId);
		const headers = table.querySelectorAll('th.sortable-header');

		headers.forEach((header, index) => {
			const arrows = header.querySelectorAll('.sort-arrow');

			if (index === columnIndex) {
				// Remove active class from both arrows first
				arrows[0].classList.remove('active');
				arrows[1].classList.remove('active');
				// Add active class to the appropriate arrow
				if (ascending) {
					arrows[0].classList.add('active');
				} else {
					arrows[1].classList.add('active');
				}
			} else {
				// Remove active class from both arrows
				arrows[0].classList.remove('active');
				arrows[1].classList.remove('active');
			}
		});
	}

	function sortFileMetricsTable(columnIndex) {
		const table = document.getElementById('fileMetricsTable');
		const tbody = document.getElementById('fileMetricsBody');
		const rows = Array.from(tbody.querySelectorAll('tr'));

		// Toggle sort direction if clicking the same column
		if (fileMetricsSortState.column === columnIndex) {
			fileMetricsSortState.ascending = !fileMetricsSortState.ascending;
		} else {
			fileMetricsSortState.column = columnIndex;
			fileMetricsSortState.ascending = true;
		}

		const ascending = fileMetricsSortState.ascending;
		const sortType = table.querySelectorAll('th')[columnIndex].getAttribute('data-sort-type');

		// Sort rows (separate packages and files)
		const packageRows = rows.filter(row => row.classList.contains('package-row'));
		const fileRows = rows.filter(row => row.hasAttribute('data-parent'));

		packageRows.sort((a, b) => {
			const aVal = a.cells[columnIndex].textContent.trim();
			const bVal = b.cells[columnIndex].textContent.trim();
			return compareValues(aVal, bVal, sortType, ascending);
		});

		// Clear tbody
		tbody.innerHTML = '';

		// Re-add sorted rows
		packageRows.forEach(packageRow => {
			tbody.appendChild(packageRow);
			const packageName = packageRow.querySelector('[data-package]').getAttribute('data-package');
			const children = fileRows.filter(row => row.getAttribute('data-parent') === packageName);

			children.sort((a, b) => {
				const aVal = a.cells[columnIndex].textContent.trim();
				const bVal = b.cells[columnIndex].textContent.trim();
				return compareValues(aVal, bVal, sortType, ascending);
			});

			children.forEach(child => tbody.appendChild(child));
		});

		updateSortIcons('fileMetricsTable', columnIndex, ascending);
	}

	function sortMembersTable(columnIndex) {
		const tbody = document.getElementById('fileMembersBody');
		const rows = Array.from(tbody.querySelectorAll('tr'));

		// Check if table is empty
		if (rows.length === 0 || (rows.length === 1 && rows[0].cells[0].getAttribute('colspan'))) {
			return;
		}

		if (membersSortState.column === columnIndex) {
			membersSortState.ascending = !membersSortState.ascending;
		} else {
			membersSortState.column = columnIndex;
			membersSortState.ascending = true;
		}

		const ascending = membersSortState.ascending;
		const table = document.getElementById('fileMembersTable');
		const sortType = table.querySelectorAll('th')[columnIndex].getAttribute('data-sort-type');

		rows.sort((a, b) => {
			let aVal, bVal;

			if (sortType === 'boolean') {
				// For Scaladoc column, check for presence of green checkmark
				aVal = a.cells[columnIndex].innerHTML.includes('text-green-600') ? 1 : 0;
				bVal = b.cells[columnIndex].innerHTML.includes('text-green-600') ? 1 : 0;
				return ascending ? aVal - bVal : bVal - aVal;
			} else {
				aVal = a.cells[columnIndex].textContent.trim();
				bVal = b.cells[columnIndex].textContent.trim();
				return compareValues(aVal, bVal, sortType, ascending);
			}
		});

		tbody.innerHTML = '';
		rows.forEach(row => tbody.appendChild(row));

		updateSortIcons('fileMembersTable', columnIndex, ascending);
	}

	function sortMethodsTable(columnIndex) {
		const tbody = document.getElementById('fileMethodsBody');
		const rows = Array.from(tbody.querySelectorAll('tr'));

		if (rows.length === 0) {
			return;
		}

		if (methodsSortState.column === columnIndex) {
			methodsSortState.ascending = !methodsSortState.ascending;
		} else {
			methodsSortState.column = columnIndex;
			methodsSortState.ascending = true;
		}

		const ascending = methodsSortState.ascending;
		const table = document.getElementById('fileMethodsTable');
		const sortType = table.querySelectorAll('th')[columnIndex].getAttribute('data-sort-type');

		rows.sort((a, b) => {
			let aVal, bVal;

			if (sortType === 'boolean') {
				aVal = a.cells[columnIndex].innerHTML.includes('text-green-600') ? 1 : 0;
				bVal = b.cells[columnIndex].innerHTML.includes('text-green-600') ? 1 : 0;
				return ascending ? aVal - bVal : bVal - aVal;
			} else {
				aVal = a.cells[columnIndex].textContent.trim();
				bVal = b.cells[columnIndex].textContent.trim();
				return compareValues(aVal, bVal, sortType, ascending);
			}
		});

		tbody.innerHTML = '';
		rows.forEach(row => tbody.appendChild(row));

		updateSortIcons('fileMethodsTable', columnIndex, ascending);
	}

	function compareValues(aVal, bVal, sortType, ascending) {
		let comparison = 0;

		if (sortType === 'number') {
			const aNum = parseFloat(aVal.replace(/,/g, ''));
			const bNum = parseFloat(bVal.replace(/,/g, ''));
			comparison = aNum - bNum;
		} else {
			comparison = aVal.localeCompare(bVal, undefined, {numeric: true, sensitivity: 'base'});
		}

		return ascending ? comparison : -comparison;
	}

	// Expose the necessary functions to global scope for onclick handlers
	window.switchTab = switchTab;
	window.sortFileMetricsTable = sortFileMetricsTable;
	window.sortMembersTable = sortMembersTable;
	window.sortMethodsTable = sortMethodsTable;
	window.toggleExpandCollapse = toggleExpandCollapse;
	window.togglePackage = togglePackage;
	window.showFileDetails = showFileDetails;
	window.extractMethodName = extractMethodName;
	window.openMethodComplexityTab = openMethodComplexityTab;
	window.openMemberComplexityTab = openMemberComplexityTab;

} // End of initializePage function

// Start the decompression and initialization process
(async function () {
	try {
		const decompressedString = await decompressData(compressedData);
		// Execute the decompressed JavaScript to set metricsData
		// Use Function constructor to ensure metricsData is accessible
		const fn = new Function(decompressedString + '; return metricsData;');
		globalData = fn();

		// Trigger initialization of the page
		initializePage();
	} catch (error) {
		console.error('Failed to decompress metrics data:', error);
		document.body.innerHTML = '<div class="error-message" style="padding: 2rem; text-align: center; color: red;">Failed to load metrics data. Please check the console for errors.</div>';
	}
})();