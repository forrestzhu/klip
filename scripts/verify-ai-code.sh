#!/bin/bash

# Klip AI Code Verification Script
# 验证 AI 生成的代码是否符合 Constitution 和 SPEC 规范

set -e

echo "🔍 Klip AI Code Verification"
echo "=============================="

# 1. 代码风格检查
echo ""
echo "📝 Step 1: Code Style Check (Biome)"
npm run lint

# 2. 类型检查
echo ""
echo "📝 Step 2: Type Check (TypeScript)"
npm run typecheck

# 3. 单元测试
echo ""
echo "📝 Step 3: Unit Tests (Vitest)"
npm run test

# 4. E2E 测试
echo ""
echo "📝 Step 4: E2E Tests (Playwright)"
npm run test:e2e

# 5. Rust 检查
echo ""
echo "📝 Step 5: Rust Code Check"
npm run cargo:check

# 6. 安全检查
echo ""
echo "📝 Step 6: Security Check"
echo "Checking for hardcoded secrets..."
if grep -r "api_key\|password\|secret" src/ --include="*.ts" --include="*.tsx" | grep -v "placeholder\|example\|type"; then
  echo "❌ Found potential hardcoded secrets!"
  exit 1
else
  echo "✅ No hardcoded secrets found"
fi

# 7. 测试覆盖检查
echo ""
echo "📝 Step 7: Test Coverage Check"
npm run test:coverage

echo ""
echo "✅ All verifications passed!"
echo "AI-generated code complies with Constitution and SPEC"
