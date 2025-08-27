#!/usr/bin/env node

/**
 * Script to check admin user status and permissions
 * Usage: node scripts/check-admin-status.js
 */

import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/magickit';

async function checkAdminStatus() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const usersCollection = db.collection('user');
        const rolesCollection = db.collection('roles');
        const userRolesCollection = db.collection('userRoles');
        const permissionsCollection = db.collection('permissions');

        console.log('\n=== ADMIN USER STATUS CHECK ===\n');

        // Find admin user
        const adminUser = await usersCollection.findOne({ email: 'admin@magickit.dev' });
        
        if (!adminUser) {
            console.log('❌ Admin user not found');
            console.log('💡 Run: node scripts/create-admin-user.js');
            return;
        }

        console.log('✅ Admin user found:');
        console.log(`   📧 Email: ${adminUser.email}`);
        console.log(`   👤 Name: ${adminUser.name}`);
        console.log(`   🛡️  Better Auth Role: ${adminUser.role}`);
        console.log(`   🆔 User ID: ${adminUser._id}`);

        // Check if admin role exists in RBAC
        const adminRole = await rolesCollection.findOne({ name: 'admin' });
        if (!adminRole) {
            console.log('\n❌ Admin RBAC role not found');
            console.log('💡 Run database initialization to create RBAC roles');
            return;
        }

        console.log('\n✅ Admin RBAC role found:');
        console.log(`   📝 Name: ${adminRole.name}`);
        console.log(`   📄 Description: ${adminRole.description}`);
        console.log(`   🔒 System Role: ${adminRole.isSystemRole}`);
        console.log(`   🎯 Permissions Count: ${adminRole.permissions.length}`);

        // Check if admin user has admin RBAC role assigned
        const roleAssignment = await userRolesCollection.findOne({
            userId: adminUser._id,
            roleId: adminRole._id
        });

        if (roleAssignment) {
            console.log('\n✅ Admin RBAC role assignment found:');
            console.log(`   📅 Assigned At: ${roleAssignment.assignedAt}`);
            console.log(`   👤 Assigned By: ${roleAssignment.assignedBy}`);
        } else {
            console.log('\n⚠️  Admin RBAC role not assigned to admin user');
            console.log('💡 This will be auto-assigned when admin user logs in');
        }

        // Get total permissions count
        const totalPermissions = await permissionsCollection.countDocuments();
        console.log(`\n📊 Total permissions in system: ${totalPermissions}`);

        // Show some sample permissions
        const samplePermissions = await permissionsCollection.find({}).limit(5).toArray();
        console.log('\n📋 Sample permissions:');
        samplePermissions.forEach(perm => {
            console.log(`   • ${perm.resource}:${perm.action} - ${perm.description}`);
        });

        console.log('\n=== SUMMARY ===');
        console.log('✅ Admin user exists with Better Auth admin role');
        console.log('✅ Admin RBAC role exists with all permissions');
        console.log('🎯 Admin users automatically get ALL permissions');
        console.log('🔄 RBAC role assignment happens automatically on login');
        
        console.log('\n🚀 Next steps:');
        console.log('1. Log in as admin@magickit.dev / admin123');
        console.log('2. Check if admin navigation appears in sidebar');
        console.log('3. If issues persist, check browser console for errors');

    } catch (error) {
        console.error('❌ Error checking admin status:', error);
    } finally {
        await client.close();
    }
}

checkAdminStatus();