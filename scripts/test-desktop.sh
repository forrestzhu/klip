#!/bin/bash

# Klip Desktop Testing Script
# This script runs desktop tests for the Tauri application

set -e

echo "🧪 Running Klip Desktop Tests..."
echo ""

# Check if Tauri app is running
if ! pgrep -f "Klip" > /dev/null; then
    echo "⚠️  Warning: Klip app doesn't appear to be running"
    echo "   Starting tests anyway (tests will start the app if needed)"
fi

# Run Playwright desktop tests
npx playwright test --config=playwright.desktop.config.ts "$@"
