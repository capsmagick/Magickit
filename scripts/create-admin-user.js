#!/usr/bin/env node

/**
 * Script to create an admin user for testing
 * Usage: node scripts/create-admin-user.js
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
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

        // Check if admin user already exists
        const existingAdmin = await usersCollection.findOne({ email: 'admin@magickit.dev' });

        if (existingAdmin) {
            console.log('Admin user already exists with email: admin@magickit.dev');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 12);

        // Create admin user
        const adminUser = {
            email: 'admin@magickit.dev',
            name: 'Admin User',
            role: 'admin',
            hashedPassword,
            emailVerified: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await usersCollection.insertOne(adminUser);

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@magickit.dev');
        console.log('🔑 Password: admin123');
        console.log('👤 User ID:', result.insertedId);
        console.log('\n🚀 You can now log in at /login');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await client.close();
    }
}

createAdminUser();