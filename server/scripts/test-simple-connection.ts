#!/usr/bin/env tsx

/**
 * Simple test script for MongoDB connection
 */

import 'dotenv/config';
import { getDatabase } from '../src/db/mongodb.js';

async function test() {
  try {
    console.log('Testing MongoDB connection...');
    const db = await getDatabase();
    const result = await db.admin().ping();
    console.log('✅ Connection successful!', result);
    
    // Test collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

test();

