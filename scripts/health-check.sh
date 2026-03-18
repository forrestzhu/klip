#!/bin/bash
# Klip Project Health Check
# Quick verification of project state before development
# Usage: ./scripts/health-check.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Klip Project Health Check"
echo "=============================="
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
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
    echo "   💡 Tip: Commit or stash changes before building"
fi

# Run quick lint check
echo "5. Running lint check..."
if npm run lint > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Lint pass${NC}"
else
    echo -e "   ${RED}❌ Lint fail${NC}"
fi

# Run quick typecheck
echo "6. Running typecheck..."
if npm run typecheck > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Typecheck pass${NC}"
else
    echo -e "   ${RED}❌ Typecheck fail${NC}"
fi

# Check test status (quick)
echo "7. Checking tests..."
if npm run test > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Tests pass${NC}"
else
    echo -e "   ${YELLOW}⚠️  Tests need attention${NC}"
fi

echo ""
echo "=============================="
echo "Health check complete!"
