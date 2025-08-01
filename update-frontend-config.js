#!/usr/bin/env node

/**
 * Script to update frontend configuration after backend deployment
 * Usage: node update-frontend-config.js <deployed-url>
 * Example: node update-frontend-config.js https://my-app.railway.app
 */

const fs = require('fs');
const path = require('path');

const deployedUrl = process.argv[2];

if (!deployedUrl) {
  console.log('❌ Please provide the deployed URL as an argument');
  console.log('Usage: node update-frontend-config.js <deployed-url>');
  console.log('Example: node update-frontend-config.js https://my-app.railway.app');
  process.exit(1);
}

// Validate URL format
if (!deployedUrl.startsWith('http')) {
  console.log('❌ Please provide a valid URL starting with http:// or https://');
  process.exit(1);
}

const configPath = path.join(__dirname, 'app', 'src', 'config', 'backend.ts');

try {
  // Read the current config file
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Update the BACKEND_URL
  configContent = configContent.replace(
    /export const BACKEND_URL = process\.env\.EXPO_PUBLIC_BACKEND_URL \|\| 'http:\/\/localhost:8000';/,
    `export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '${deployedUrl}';`
  );
  
  // Write the updated config
  fs.writeFileSync(configPath, configContent);
  
  console.log('✅ Frontend configuration updated successfully!');
  console.log(`📱 Backend URL updated to: ${deployedUrl}`);
  console.log('');
  console.log('🔄 Next steps:');
  console.log('1. Rebuild your frontend app');
  console.log('2. Test the API connection');
  console.log('3. Deploy your frontend if needed');
  
} catch (error) {
  console.log('❌ Error updating configuration:', error.message);
  process.exit(1);
} 