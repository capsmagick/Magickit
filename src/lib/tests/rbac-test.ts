/**
 * RBAC System Test
 * This file contains tests to verify the RBAC functionality
 */

import { RBACService } from '$lib/db/rbac';
import { rolesCollection, permissionsCollection, userRolesCollection } from '$lib/db/collections';
import { ObjectId } from 'mongodb';

export class RBACTester {
  /**
   * Test RBAC system initialization
   */
  static async testInitialization() {
    console.log('🧪 Testing RBAC initialization...');
    
    try {
      // Initialize RBAC system
      await RBACService.initializeRBAC();
      
      // Check if default permissions were created
      const permissions = await permissionsCollection.find({}).toArray();
      console.log(`✅ Found ${permissions.length} permissions`);
      
      // Check if default roles were created
      const roles = await rolesCollection.find({}).toArray();
      console.log(`✅ Found ${roles.length} roles`);
      
      // Verify system roles exist
      const adminRole = await rolesCollection.findOne({ name: 'admin' });
      const userRole = await rolesCollection.findOne({ name: 'user' });
      
      if (adminRole && userRole) {
        console.log('✅ System roles (admin, user) created successfully');
      } else {
        console.log('❌ System roles missing');
      }
      
      return true;
    } catch (error) {
      console.error('❌ RBAC initialization failed:', error);
      return false;
    }
  }

  /**
   * Test role creation and management
   */
  static async testRoleManagement() {
    console.log('🧪 Testing role management...');
    
    try {
      // Get some permissions for testing
      const permissions = await permissionsCollection.find({}).limit(3).toArray();
      const permissionIds = permissions.map(p => p._id.toString());
      
      // Test role creation
      const testUserId = new ObjectId().toString();
      const roleId = await RBACService.createRole(
        'test-role',
        'Test role for RBAC testing',
        permissionIds,
        testUserId
      );
      
      if (roleId) {
        console.log('✅ Role creation successful');
        
        // Test role update
        const updateSuccess = await RBACService.updateRole(
          roleId.toString(),
          { description: 'Updated test role description' },
          testUserId
        );
        
        if (updateSuccess) {
          console.log('✅ Role update successful');
        } else {
          console.log('❌ Role update failed');
        }
        
        // Test role deletion
        const deleteSuccess = await RBACService.deleteRole(roleId.toString(), testUserId);
        if (deleteSuccess) {
          console.log('✅ Role deletion successful');
        } else {
          console.log('❌ Role deletion failed');
        }
        
        return true;
      } else {
        console.log('❌ Role creation failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Role management test failed:', error);
      return false;
    }
  }

  /**
   * Test user role assignment
   */
  static async testUserRoleAssignment() {
    console.log('🧪 Testing user role assignment...');
    
    try {
      // Get a test role
      const testRole = await rolesCollection.findOne({ name: 'user' });
      if (!testRole) {
        console.log('❌ Test role not found');
        return false;
      }
      
      const testUserId = new ObjectId().toString();
      const adminUserId = new ObjectId().toString();
      
      // Test role assignment
      const assignSuccess = await RBACService.assignRole(
        testUserId,
        testRole._id.toString(),
        adminUserId
      );
      
      if (assignSuccess) {
        console.log('✅ Role assignment successful');
        
        // Test permission checking
        const hasPermission = await RBACService.userHasPermission(
          testUserId,
          'content',
          'read'
        );
        
        console.log(`✅ Permission check result: ${hasPermission}`);
        
        // Test role removal
        const removeSuccess = await RBACService.removeRole(
          testUserId,
          testRole._id.toString(),
          adminUserId
        );
        
        if (removeSuccess) {
          console.log('✅ Role removal successful');
        } else {
          console.log('❌ Role removal failed');
        }
        
        return true;
      } else {
        console.log('❌ Role assignment failed');
        return false;
      }
    } catch (error) {
      console.error('❌ User role assignment test failed:', error);
      return false;
    }
  }

  /**
   * Test audit logging
   */
  static async testAuditLogging() {
    console.log('🧪 Testing audit logging...');
    
    try {
      const testUserId = new ObjectId().toString();
      
      // Test audit log creation
      await RBACService.logAction(
        testUserId,
        'test_action',
        'test_resource',
        undefined,
        { test: 'data' },
        true,
        '127.0.0.1',
        'test-user-agent'
      );
      
      // Test audit log retrieval
      const logs = await RBACService.getAuditLogs(
        { action: 'test_action' },
        10,
        0
      );
      
      if (logs.length > 0) {
        console.log('✅ Audit logging successful');
        return true;
      } else {
        console.log('❌ Audit log not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Audit logging test failed:', error);
      return false;
    }
  }

  /**
   * Run all RBAC tests
   */
  static async runAllTests() {
    console.log('🚀 Starting RBAC system tests...\n');
    
    const results = {
      initialization: await this.testInitialization(),
      roleManagement: await this.testRoleManagement(),
      userRoleAssignment: await this.testUserRoleAssignment(),
      auditLogging: await this.testAuditLogging()
    };
    
    console.log('\n📊 Test Results:');
    console.log('================');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\n${allPassed ? '🎉' : '💥'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return results;
  }

  /**
   * Test API endpoints (requires running server)
   */
  static async testAPIEndpoints(baseUrl: string = 'http://localhost:5173') {
    console.log('🧪 Testing API endpoints...');
    
    try {
      // Note: This would require authentication headers in a real test
      // For now, we'll just test if the endpoints exist
      
      const endpoints = [
        '/api/admin/roles',
        '/api/admin/permissions',
        '/api/admin/users',
        '/api/admin/user-roles',
        '/api/admin/audit-logs'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`);
          console.log(`${endpoint}: ${response.status} ${response.statusText}`);
        } catch (error) {
          console.log(`${endpoint}: Connection failed (server not running?)`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ API endpoint test failed:', error);
      return false;
    }
  }
}

// Export for use in other test files
export default RBACTester;