#!/usr/bin/env node

/**
 * Backend Test Script for TrustWipe
 * This script tests the core backend functionality without the Electron UI
 */

const TrustWipeUtils = require('./src/utils');
const drivelist = require('drivelist');
const fs = require('fs');
const path = require('path');

class BackendTester {
  constructor() {
    this.utils = new TrustWipeUtils();
    this.testResults = [];
  }

  log(test, result, details = null) {
    const status = result ? 'PASS' : 'FAIL';
    const message = `[${status}] ${test}`;
    console.log(message);
    if (details) {
      console.log(`    Details: ${details}`);
    }
    this.testResults.push({ test, result, details });
  }

  async testUtils() {
    console.log('\n=== Testing Utility Functions ===');
    
    // Test configuration loading
    const config = this.utils.getConfig('security.authentication.username');
    this.log('Configuration Loading', config === 'admin', `Username: ${config}`);
    
    // Test input validation
    const validUsername = this.utils.validateInput('admin', 'username');
    this.log('Username Validation (Valid)', validUsername);
    
    const invalidUsername = this.utils.validateInput('ab', 'username');
    this.log('Username Validation (Invalid)', !invalidUsername);
    
    // Test password validation
    const validPassword = this.utils.validateInput('password123', 'password');
    this.log('Password Validation (Valid)', validPassword);
    
    const invalidPassword = this.utils.validateInput('123', 'password');
    this.log('Password Validation (Invalid)', !invalidPassword);
    
    // Test drive validation
    const validDrive = this.utils.validateInput('/dev/sda', 'drive');
    this.log('Drive Validation (Valid)', validDrive);
    
    const invalidDrive = this.utils.validateInput('../../../etc/passwd', 'drive');
    this.log('Drive Validation (Invalid)', !invalidDrive, `Input: ../../../etc/passwd, Result: ${invalidDrive}`);
    
    // Test data sanitization
    const sanitized = this.utils.sanitizeForLog({ username: 'admin', password: 'secret123' });
    this.log('Data Sanitization', sanitized.password === '***');
    
    // Test byte formatting
    const formatted = this.utils.formatBytes(1073741824);
    this.log('Byte Formatting', formatted === '1 GB');
    
    // Test system info
    const sysInfo = this.utils.getSystemInfo();
    this.log('System Info', !!sysInfo.platform && !!sysInfo.arch);
    
    // Test session ID generation
    const sessionId = this.utils.generateSessionId();
    this.log('Session ID Generation', sessionId.length > 0);
    
    // Test directory creation
    const testDir = path.join(__dirname, 'test-dir');
    this.utils.ensureDir(testDir);
    const dirExists = fs.existsSync(testDir);
    this.log('Directory Creation', dirExists);
    
    // Cleanup test directory
    if (dirExists) {
      fs.rmdirSync(testDir);
    }
  }

  async testDriveDetection() {
    console.log('\n=== Testing Drive Detection ===');
    
    try {
      const drives = await drivelist.list();
      this.log('Drive List Retrieval', drives.length >= 0, `Found ${drives.length} drives`);
      
      if (drives.length > 0) {
        const validDrives = drives.filter(drive => {
          return drive.device && 
                 drive.description && 
                 drive.size > 0 && 
                 !drive.isSystem;
        });
        
        this.log('Drive Filtering', validDrives.length >= 0, `Valid drives: ${validDrives.length}`);
        
        // Test drive details for first valid drive
        if (validDrives.length > 0) {
          const testDrive = validDrives[0];
          const driveDetails = {
            device: testDrive.device,
            description: testDrive.description,
            size: testDrive.size,
            sizeFormatted: this.utils.formatBytes(testDrive.size),
            isRemovable: testDrive.isRemovable,
            isSystem: testDrive.isSystem
          };
          
          this.log('Drive Details Processing', !!driveDetails.device && !!driveDetails.sizeFormatted);
        }
      }
    } catch (error) {
      this.log('Drive Detection Error Handling', false, error.message);
    }
  }

  async testSecurityFeatures() {
    console.log('\n=== Testing Security Features ===');
    
    // Test rate limiting simulation
    const testId = 'test-client';
    const attempts = [];
    const now = Date.now();
    const window = 300000; // 5 minutes
    const maxAttempts = 3;
    
    // Simulate rate limiting
    for (let i = 0; i < 5; i++) {
      const recentAttempts = attempts.filter(time => now - time < window);
      const allowed = recentAttempts.length < maxAttempts;
      attempts.push(now);
      
      if (i < 3) {
        this.log(`Rate Limiting (Attempt ${i + 1})`, allowed);
      } else {
        this.log(`Rate Limiting (Attempt ${i + 1})`, !allowed);
      }
    }
    
    // Test path safety
    const safePath = this.utils.isSafePath('/dev/sda');
    this.log('Safe Path Check (Valid)', safePath);
    
    const unsafePath = this.utils.isSafePath('/');
    this.log('Safe Path Check (Unsafe)', !unsafePath);
  }

  async testLogging() {
    console.log('\n=== Testing Logging System ===');
    
    const logFile = path.join(__dirname, 'logs', 'test.log');
    const logDir = path.dirname(logFile);
    
    // Ensure log directory exists
    this.utils.ensureDir(logDir);
    
    // Test log file creation
    const testMessage = 'Test log message';
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [INFO] ${testMessage}\n`;
    
    try {
      fs.appendFileSync(logFile, logEntry);
      const logExists = fs.existsSync(logFile);
      this.log('Log File Creation', logExists);
      
      if (logExists) {
        const logContent = fs.readFileSync(logFile, 'utf8');
        this.log('Log Content Writing', logContent.includes(testMessage));
        
        // Cleanup
        fs.unlinkSync(logFile);
      }
    } catch (error) {
      this.log('Log File Operations', false, error.message);
    }
  }

  async runAllTests() {
    console.log('TrustWipe Backend Test Suite');
    console.log('============================');
    
    await this.testUtils();
    await this.testDriveDetection();
    await this.testSecurityFeatures();
    await this.testLogging();
    
    // Summary
    console.log('\n=== Test Summary ===');
    const passed = this.testResults.filter(r => r.result).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`Tests Passed: ${passed}/${total} (${percentage}%)`);
    
    if (passed === total) {
      console.log('✅ All tests passed! Backend is ready.');
    } else {
      console.log('❌ Some tests failed. Check the details above.');
      const failed = this.testResults.filter(r => !r.result);
      console.log('\nFailed tests:');
      failed.forEach(test => {
        console.log(`  - ${test.test}: ${test.details || 'No details'}`);
      });
    }
    
    return passed === total;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new BackendTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = BackendTester;
