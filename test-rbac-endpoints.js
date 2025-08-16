#!/usr/bin/env node

/**
 * Quick test script to check RBAC endpoints
 * Run this after starting the dev server with `npm run dev`
 */

const BASE_URL = 'http://localhost:5173';

const endpoints = [
  '/api/admin/roles',
  '/api/admin/permissions', 
  '/api/admin/users',
  '/api/admin/user-roles',
  '/api/admin/audit-logs'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    if (response.status === 401) {
      console.log(`✅ ${endpoint}: ${response.status} (Unauthorized - Auth working)`);
    } else if (response.ok) {
      console.log(`✅ ${endpoint}: ${response.status} (OK)`);
    } else {
      console.log(`⚠️  ${endpoint}: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint}: Connection failed (${error.message})`);
  }
}

async function testPages() {
  const pages = [
    '/admin/access-control',
    '/admin/access-control/roles',
    '/admin/access-control/permissions',
    '/admin/access-control/assign',
    '/admin/access-control/audit'
  ];

  console.log('\n🌐 Testing RBAC Pages...');
  for (const page of pages) {
    try {
      const response = await fetch(`${BASE_URL}${page}`);
      if (response.ok) {
        console.log(`✅ ${page}: ${response.status} (OK)`);
      } else {
        console.log(`⚠️  ${page}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${page}: Connection failed (${error.message})`);
    }
  }
}

async function main() {
  console.log('🔐 RBAC Endpoints Test');
  console.log('======================');
  console.log('Make sure the dev server is running: npm run dev\n');

  console.log('🔌 Testing API Endpoints...');
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }

  await testPages();

  console.log('\n📝 Notes:');
  console.log('- 401 responses are expected for unauthenticated requests');
  console.log('- Pages should return 200 (they handle auth client-side)');
  console.log('- Connection failures mean the server is not running');
}

main().catch(console.error);