#!/usr/bin/env node

/**
 * RBAC Test Runner
 * Run this script to test the RBAC system functionality
 */

import { RBACTester } from '../src/lib/tests/rbac-test.js';

async function main() {
  console.log('🔐 RBAC System Test Runner');
  console.log('==========================\n');
  
  try {
    // Run all RBAC tests
    const results = await RBACTester.runAllTests();
    
    // Test API endpoints if server is running
    console.log('\n🌐 Testing API endpoints...');
    await RBACTester.testAPIEndpoints();
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
}

main();