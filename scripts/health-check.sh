#!/bin/bash
# Klip Project Health Check
# Quick verification of project state before development

set -e

echo "🔍 Klip Project Health Check"
echo "=============================="
echo ""

# Check Node version
echo "1. Checking Node version..."
NODE_VERSION=$(node -v)
echo "   Node: $NODE_VERSION"

# Check Rust version
echo "2. Checking Rust version..."
RUST_VERSION=$(rustc --version 2>/dev/null || echo "Not installed")
echo "   Rust: $RUST_VERSION"

# Check dependencies
echo "3. Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules exists"
else
    echo "   ⚠️  node_modules missing - run 'npm install'"
fi

# Check for dirty working tree
echo "4. Checking working tree..."
GIT_STATUS=$(git status --porcelain)
if [ -z "$GIT_STATUS" ]; then
    echo "   ✅ Working tree clean"
else
    echo "   ⚠️  Working tree dirty:"
    echo "$GIT_STATUS" | head -5
fi

# Run quick lint check
echo "5. Running lint check..."
npm run lint > /dev/null 2>&1 && echo "   ✅ Lint pass" || echo "   ❌ Lint fail"

# Run quick typecheck
echo "6. Running typecheck..."
npm run typecheck > /dev/null 2>&1 && echo "   ✅ Typecheck pass" || echo "   ❌ Typecheck fail"

# Check test status (quick)
echo "7. Checking tests..."
npm run test > /dev/null 2>&1 && echo "   ✅ Tests pass" || echo "   ⚠️  Tests need attention"

echo ""
echo "=============================="
echo "Health check complete!"
