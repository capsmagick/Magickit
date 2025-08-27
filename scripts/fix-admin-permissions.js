#!/usr/bin/env node

/**
 * Script to fix admin user permissions
 * Usage: node scripts/fix-admin-permissions.js
 */

import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/magickit';

async function fixAdminPermissions() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const usersCollection = db.collection('user');
        const rolesCollection = db.collection('roles');
        const userRolesCollection = db.collection('userRoles');

        console.log('\n=== FIXING ADMIN PERMISSIONS ===\n');

        // Find or create admin user
        let adminUser = await usersCollection.findOne({ email: 'renoy@knowbin.tech' });
        
        if (!adminUser) {
            console.log('❌ Admin user not found, creating user record...');
            console.log('💡 Password will need to be set through Better Auth signup/API');

            const newAdminUser = {
                email: 'renoy@knowbin.tech',
                name: 'Admin User',
                role: 'admin', // Better Auth admin role
                emailVerified: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await usersCollection.insertOne(newAdminUser);
            adminUser = { ...newAdminUser, _id: result.insertedId };
            console.log('✅ Admin user record created');
        } else {
            console.log('✅ Admin user found');
            
            // Ensure admin user has admin role
            if (adminUser.role !== 'admin') {
                await usersCollection.updateOne(
                    { _id: adminUser._id },
                    { $set: { role: 'admin', updatedAt: new Date() } }
                );
                console.log('✅ Updated admin user role to "admin"');
            }
        }

        // Find admin RBAC role
        const adminRole = await rolesCollection.findOne({ name: 'admin' });
        
        if (!adminRole) {
            console.log('❌ Admin RBAC role not found');
            console.log('💡 Run database initialization first to create RBAC system');
            return;
        }

        console.log('✅ Admin RBAC role found');

        // Check if admin user has admin RBAC role assigned
        const existingAssignment = await userRolesCollection.findOne({
            userId: adminUser._id,
            roleId: adminRole._id
        });

        if (!existingAssignment) {
            // Assign admin RBAC role to admin user
            const roleAssignment = {
                userId: adminUser._id,
                roleId: adminRole._id,
                assignedBy: adminUser._id, // Self-assigned
                assignedAt: new Date()
            };

            await userRolesCollection.insertOne(roleAssignment);
            console.log('✅ Admin RBAC role assigned to admin user');
        } else {
            console.log('✅ Admin user already has admin RBAC role');
        }

        console.log('\n=== VERIFICATION ===');
        
        // Verify the setup
        const verifyUser = await usersCollection.findOne({ _id: adminUser._id });
        const verifyAssignment = await userRolesCollection.findOne({
            userId: adminUser._id,
            roleId: adminRole._id
        });

        console.log(`📧 Email: ${verifyUser.email}`);
        console.log(`🛡️  Better Auth Role: ${verifyUser.role}`);
        console.log(`🎯 RBAC Role Assigned: ${verifyAssignment ? 'Yes' : 'No'}`);
        console.log(`🔑 Permissions: ALL (${adminRole.permissions.length} permissions)`);

        console.log('\n🚀 Admin user is now properly configured!');
        console.log('📝 Next steps:');
        console.log('   1. Sign up at /signup with email: admin@magickit.dev');
        console.log('   2. Or use Better Auth API to set password');
        console.log('   3. Login and access admin panel');

    } catch (error) {
        console.error('❌ Error fixing admin permissions:', error);
    } finally {
        await client.close();
    }
}

fixAdminPermissions();