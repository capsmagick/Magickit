#!/usr/bin/env node

/**
 * Script to create an admin user for testing with full RBAC permissions
 * Usage: node scripts/create-admin-user.js
 * 
 * Note: This script creates the user record directly in the database.
 * Better Auth will handle password hashing when the user first logs in.
 * For production, use Better Auth's signup API instead.
 */

import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/magickit';

async function createAdminUser() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const usersCollection = db.collection('user');
        const rolesCollection = db.collection('roles');
        const userRolesCollection = db.collection('userRoles');

        // Check if admin user already exists
        const existingAdmin = await usersCollection.findOne({ email: 'renoy@knowbin.tech' });

        let adminUserId;

        if (existingAdmin) {
            console.log('Admin user already exists with email: admin@magickit.dev');
            adminUserId = existingAdmin._id;
            
            // Ensure admin user has admin role
            if (existingAdmin.role !== 'admin') {
                await usersCollection.updateOne(
                    { _id: existingAdmin._id },
                    { $set: { role: 'admin', updatedAt: new Date() } }
                );
                console.log('✅ Updated existing user to admin role');
            }
        } else {
            console.log('⚠️  Creating admin user directly in database');
            console.log('💡 For production, use Better Auth signup API instead');
            
            // Create admin user (Better Auth will handle password on first login)
            const adminUser = {
                email: 'renoy@knowbin.tech',
                name: 'Admin User',
                role: 'admin', // Better Auth admin role
                emailVerified: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await usersCollection.insertOne(adminUser);
            adminUserId = result.insertedId;

            console.log('✅ Admin user record created successfully!');
            console.log('📧 Email: renoy@knowbin.tech');
            console.log('👤 User ID:', adminUserId);
            console.log('⚠️  Password will be set on first login through Better Auth');
        }

        // Ensure admin RBAC role exists and assign it to the admin user
        const adminRole = await rolesCollection.findOne({ name: 'admin' });
        
        if (adminRole) {
            // Check if admin user already has the admin RBAC role
            const existingRoleAssignment = await userRolesCollection.findOne({
                userId: adminUserId,
                roleId: adminRole._id
            });

            if (!existingRoleAssignment) {
                // Assign admin RBAC role to the admin user
                const roleAssignment = {
                    userId: adminUserId,
                    roleId: adminRole._id,
                    assignedBy: adminUserId, // Self-assigned
                    assignedAt: new Date()
                };

                await userRolesCollection.insertOne(roleAssignment);
                console.log('✅ Admin RBAC role assigned to admin user');
            } else {
                console.log('✅ Admin user already has admin RBAC role');
            }
        } else {
            console.log('⚠️  Admin RBAC role not found. Make sure to run database initialization first.');
        }

        console.log('\n🔑 Admin User Details:');
        console.log('📧 Email: admin@magickit.dev');
        console.log('🛡️  Role: admin (Better Auth + RBAC)');
        console.log('✨ Permissions: ALL (Full system access)');
        console.log('\n📝 Next Steps:');
        console.log('1. Go to /signup and create the admin account with email: renoy@knowbin.tech');
        console.log('2. Or use Better Auth API to set password for existing user');
        console.log('3. Login at /login');
        console.log('4. Access admin panel at /admin');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await client.close();
    }
}

createAdminUser();