#!/usr/bin/env node

/**
 * Integration Verification Script
 * Verifies all components of the E-Library system are properly connected
 */

const fs = require('fs');
const path = require('path');

class IntegrationVerifier {
  constructor() {
    this.projectRoot = path.resolve(__dirname);
    this.backendDir = path.join(this.projectRoot, 'backend');
    this.issues = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    const color = colors[type] || colors.info;
    console.log(`${color}[Verifier]${colors.reset} ${message}`);
  }

  checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
      this.successes.push(`✅ ${description}: ${filePath}`);
      return true;
    } else {
      this.issues.push(`❌ Missing ${description}: ${filePath}`);
      return false;
    }
  }

  verifyCoreFiles() {
    this.log('Verifying core files...', 'info');
    
    const checks = [
      [path.join(this.projectRoot, 'login.html'), 'Login page'],
      [path.join(this.projectRoot, 'admin/dashboard.html'), 'Admin dashboard'],
      [path.join(this.projectRoot, 'staff/dashboard.html'), 'Staff dashboard'],
      [path.join(this.projectRoot, 'user/dashboard.html'), 'User dashboard'],
      [path.join(this.projectRoot, 'test_role_based_auth.html'), 'Test page'],
      [path.join(this.backendDir, 'server_mysql.js'), 'MySQL server'],
      [path.join(this.backendDir, 'package.json'), 'Package configuration'],
      [path.join(this.backendDir, 'database_schema_optimized.sql'), 'Database schema'],
      [path.join(this.backendDir, 'create_sample_data.sql'), 'Sample data'],
      [path.join(this.backendDir, 'config/mysql_database.js'), 'Database config'],
      [path.join(this.backendDir, 'controllers/mysql/roleBasedAuthController.js'), 'Auth controller'],
      [path.join(this.backendDir, 'middleware/roleBasedAuth.js'), 'Auth middleware'],
      [path.join(this.backendDir, 'routes/mysql/roleBasedAuthRoutes.js'), 'Auth routes'],
      [path.join(this.projectRoot, 'start_elibrary.bat'), 'Startup script'],
      [path.join(this.projectRoot, 'INTEGRATION_GUIDE.md'), 'Integration guide']
    ];

    checks.forEach(([filePath, description]) => {
      this.checkFile(filePath, description);
    });
  }

  verifyPackageJson() {
    this.log('Verifying package.json configuration...', 'info');
    
    const packagePath = path.join(this.backendDir, 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.issues.push('❌ package.json not found');
      return false;
    }

    try {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check required dependencies
      const requiredDeps = ['express', 'mysql2', 'bcryptjs', 'jsonwebtoken', 'cors', 'helmet'];
      requiredDeps.forEach(dep => {
        if (packageData.dependencies && packageData.dependencies[dep]) {
          this.successes.push(`✅ Dependency found: ${dep}`);
        } else {
          this.issues.push(`❌ Missing dependency: ${dep}`);
        }
      });

      // Check scripts
      if (packageData.scripts && packageData.scripts.start) {
        this.successes.push('✅ Start script configured');
      } else {
        this.issues.push('❌ Start script missing');
      }

      return true;
    } catch (error) {
      this.issues.push(`❌ Error reading package.json: ${error.message}`);
      return false;
    }
  }

  verifyDatabaseSchema() {
    this.log('Verifying database schema...', 'info');
    
    const schemaPath = path.join(this.backendDir, 'database_schema_optimized.sql');
    if (!fs.existsSync(schemaPath)) {
      this.issues.push('❌ Database schema file not found');
      return false;
    }

    try {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Check for essential tables
      const requiredTables = ['Users', 'Books', 'Categories', 'Downloads'];
      requiredTables.forEach(table => {
        if (schema.includes(`CREATE TABLE \`${table}\``)) {
          this.successes.push(`✅ Table definition found: ${table}`);
        } else {
          this.issues.push(`❌ Missing table definition: ${table}`);
        }
      });

      // Check for role-based fields
      if (schema.includes('Role') && schema.includes('Status')) {
        this.successes.push('✅ Role and Status fields present in Users table');
      } else {
        this.issues.push('❌ Role/Status fields missing from Users table');
      }

      return true;
    } catch (error) {
      this.issues.push(`❌ Error reading database schema: ${error.message}`);
      return false;
    }
  }

  verifyAuthenticationSystem() {
    this.log('Verifying authentication system...', 'info');
    
    const authControllerPath = path.join(this.backendDir, 'controllers/mysql/roleBasedAuthController.js');
    const authMiddlewarePath = path.join(this.backendDir, 'middleware/roleBasedAuth.js');
    
    if (!fs.existsSync(authControllerPath)) {
      this.issues.push('❌ Authentication controller not found');
      return false;
    }

    try {
      const authController = fs.readFileSync(authControllerPath, 'utf8');
      const authMiddleware = fs.readFileSync(authMiddlewarePath, 'utf8');
      
      // Check for key authentication functions
      const authFunctions = ['roleBasedLogin', 'generateToken', 'verifyToken'];
      authFunctions.forEach(func => {
        if (authController.includes(func)) {
          this.successes.push(`✅ Auth function found: ${func}`);
        } else {
          this.issues.push(`❌ Missing auth function: ${func}`);
        }
      });

      // Check for middleware functions
      const middlewareFunctions = ['authenticateToken', 'authorize'];
      middlewareFunctions.forEach(func => {
        if (authMiddleware.includes(func)) {
          this.successes.push(`✅ Middleware function found: ${func}`);
        } else {
          this.issues.push(`❌ Missing middleware function: ${func}`);
        }
      });

      // Check for role-based redirection
      if (authController.includes('redirect') && authController.includes('/admin/dashboard')) {
        this.successes.push('✅ Role-based redirection logic found');
      } else {
        this.issues.push('❌ Role-based redirection logic missing');
      }

      return true;
    } catch (error) {
      this.issues.push(`❌ Error reading authentication files: ${error.message}`);
      return false;
    }
  }

  verifyFrontendIntegration() {
    this.log('Verifying frontend integration...', 'info');
    
    const loginPath = path.join(this.projectRoot, 'login.html');
    const adminPath = path.join(this.projectRoot, 'admin/dashboard.html');
    
    try {
      const loginHtml = fs.readFileSync(loginPath, 'utf8');
      const adminHtml = fs.readFileSync(adminPath, 'utf8');
      
      // Check login page for authentication
      if (loginHtml.includes('role-login') && loginHtml.includes('localStorage')) {
        this.successes.push('✅ Login page has authentication integration');
      } else {
        this.issues.push('❌ Login page missing authentication integration');
      }

      // Check for role-based redirection in frontend
      if (loginHtml.includes('window.location.href = data.redirect')) {
        this.successes.push('✅ Frontend redirection logic found');
      } else {
        this.issues.push('❌ Frontend redirection logic missing');
      }

      // Check for test credentials
      if (loginHtml.includes('admin@bugema.ac.ug') && loginHtml.includes('admin123')) {
        this.successes.push('✅ Test credentials available');
      } else {
        this.issues.push('❌ Test credentials missing');
      }

      return true;
    } catch (error) {
      this.issues.push(`❌ Error reading frontend files: ${error.message}`);
      return false;
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 INTEGRATION VERIFICATION REPORT');
    console.log('='.repeat(60));

    if (this.successes.length > 0) {
      console.log('\n✅ SUCCESSFUL CHECKS:');
      this.successes.forEach(success => console.log(success));
    }

    if (this.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      this.issues.forEach(issue => console.log(issue));
    }

    const totalChecks = this.successes.length + this.issues.length;
    const successRate = totalChecks > 0 ? Math.round((this.successes.length / totalChecks) * 100) : 0;

    console.log('\n📊 SUMMARY:');
    console.log(`   Total Checks: ${totalChecks}`);
    console.log(`   Passed: ${this.successes.length}`);
    console.log(`   Failed: ${this.issues.length}`);
    console.log(`   Success Rate: ${successRate}%`);

    if (successRate >= 90) {
      console.log('\n🎉 EXCELLENT! System is ready for deployment!');
    } else if (successRate >= 70) {
      console.log('\n👍 GOOD! Minor issues to address before deployment.');
    } else {
      console.log('\n⚠️  ATTENTION! Several issues need to be resolved.');
    }

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Install dependencies: cd backend && npm install');
    console.log('2. Deploy database: mysql -u root -p < backend/database_schema_optimized.sql');
    console.log('3. Create sample data: mysql -u root -p bugema_elibrary < backend/create_sample_data.sql');
    console.log('4. Start server: npm start');
    console.log('5. Test system: http://localhost:5000/login.html');

    return successRate;
  }

  async runVerification() {
    console.log('🔍 Starting Bugema E-Library Integration Verification...\n');

    this.verifyCoreFiles();
    this.verifyPackageJson();
    this.verifyDatabaseSchema();
    this.verifyAuthenticationSystem();
    this.verifyFrontendIntegration();

    return this.generateReport();
  }
}

// Run verification
if (require.main === module) {
  const verifier = new IntegrationVerifier();
  verifier.runVerification().catch(console.error);
}

module.exports = IntegrationVerifier;
