const fs = require('fs');
const path = require('path');

/**
 * Utility functions for the TrustWipe application
 */

class TrustWipeUtils {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'config.json');
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from config.json
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    
    // Return default config if file doesn't exist or is invalid
    return {
      security: {
        authentication: {
          username: "admin",
          password: "password123",
          maxAttempts: 3,
          attemptWindow: 300000
        }
      },
      logging: {
        level: "INFO",
        file: "logs/app.log"
      }
    };
  }

  /**
   * Get configuration value by path
   */
  getConfig(path) {
    return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
  }

  /**
   * Validate input against configuration patterns
   */
  validateInput(input, type) {
    if (!input || typeof input !== "string") {
      return false;
    }

    const validation = this.getConfig(`security.validation.${type}`);
    if (!validation) {
      return false;
    }

    // Check length constraints
    if (validation.minLength && input.length < validation.minLength) {
      return false;
    }
    if (validation.maxLength && input.length > validation.maxLength) {
      return false;
    }

    // Check pattern if provided
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      return regex.test(input);
    }

    return true;
  }

  /**
   * Sanitize string for logging (remove sensitive data)
   */
  sanitizeForLog(data) {
    if (typeof data === 'string') {
      return data.replace(/password["\s]*[:=]["\s]*[^"'\s,}]+/gi, 'password="***"');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      if (sanitized.password) {
        sanitized.password = '***';
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * Check if running as administrator/root
   */
  isElevated() {
    if (process.platform === 'win32') {
      try {
        const { execSync } = require('child_process');
        execSync('net session', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    } else {
      return process.getuid && process.getuid() === 0;
    }
  }

  /**
   * Create directory if it doesn't exist
   */
  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Get available disk space
   */
  getDiskSpace(path) {
    try {
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        const result = execSync(`wmic logicaldisk where caption="${path}" get size,freespace /value`, { encoding: 'utf8' });
        const lines = result.split('\n');
        let freeSpace = 0;
        let totalSpace = 0;
        
        lines.forEach(line => {
          if (line.includes('FreeSpace=')) {
            freeSpace = parseInt(line.split('=')[1]) || 0;
          }
          if (line.includes('Size=')) {
            totalSpace = parseInt(line.split('=')[1]) || 0;
          }
        });
        
        return { free: freeSpace, total: totalSpace };
      } else {
        const { execSync } = require('child_process');
        const result = execSync(`df -B1 "${path}" | tail -1`, { encoding: 'utf8' });
        const parts = result.trim().split(/\s+/);
        return {
          total: parseInt(parts[1]) || 0,
          free: parseInt(parts[3]) || 0
        };
      }
    } catch (error) {
      console.error('Failed to get disk space:', error);
      return { free: 0, total: 0 };
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Check if path is safe (not system critical)
   */
  isSafePath(path) {
    const unsafePaths = [
      '/',
      '/bin',
      '/sbin',
      '/usr',
      '/etc',
      '/var',
      '/boot',
      'C:\\',
      'C:\\Windows',
      'C:\\System32'
    ];
    
    // Allow /dev paths for drive devices
    if (path.startsWith('/dev/')) {
      return true;
    }
    
    return !unsafePaths.some(unsafe => path.startsWith(unsafe));
  }
}

module.exports = TrustWipeUtils;
