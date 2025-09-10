#!/bin/bash

# TrustWipe Setup Script
# This script automates the initial setup of the TrustWipe application

set -e

echo "🚀 TrustWipe Setup Script"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    print_header "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js found: $NODE_VERSION"
        
        # Check if version is 16 or higher
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -ge 16 ]; then
            print_status "Node.js version is compatible"
        else
            print_error "Node.js version 16 or higher is required. Current: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        print_status "Download from: https://nodejs.org/"
        exit 1
    fi
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing dependencies..."
    
    if [ -f "package.json" ]; then
        print_status "Installing npm packages..."
        npm install
        
        if [ $? -eq 0 ]; then
            print_status "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            exit 1
        fi
    else
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
}

# Set up file permissions
setup_permissions() {
    print_header "Setting up file permissions..."
    
    # Make scripts executable
    if [ -f "wipe_linux.sh" ]; then
        chmod +x wipe_linux.sh
        print_status "Made wipe_linux.sh executable"
    fi
    
    if [ -f "test-backend.js" ]; then
        chmod +x test-backend.js
        print_status "Made test-backend.js executable"
    fi
    
    # Create logs directory
    mkdir -p logs
    chmod 755 logs
    print_status "Created logs directory"
    
    # Set secure permissions for config
    if [ -f "config.json" ]; then
        chmod 600 config.json
        print_status "Set secure permissions for config.json"
    fi
}

# Run tests
run_tests() {
    print_header "Running backend tests..."
    
    if [ -f "test-backend.js" ]; then
        print_status "Executing test suite..."
        npm test
        
        if [ $? -eq 0 ]; then
            print_status "All tests passed! ✅"
        else
            print_warning "Some tests failed. Check the output above."
        fi
    else
        print_warning "test-backend.js not found. Skipping tests."
    fi
}

# Check system requirements
check_system_requirements() {
    print_header "Checking system requirements..."
    
    # Check available disk space
    AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 500000 ]; then
        print_warning "Low disk space. At least 500MB recommended."
    else
        print_status "Sufficient disk space available"
    fi
    
    # Check memory
    if command -v free &> /dev/null; then
        TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
        if [ "$TOTAL_MEM" -lt 4000 ]; then
            print_warning "Low memory. At least 4GB RAM recommended."
        else
            print_status "Sufficient memory available"
        fi
    fi
    
    # Check platform-specific tools
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_status "Linux detected. Checking required tools..."
        
        if command -v hdparm &> /dev/null; then
            print_status "hdparm found"
        else
            print_warning "hdparm not found. Install with: sudo apt install hdparm"
        fi
        
        if command -v nvme &> /dev/null; then
            print_status "nvme-cli found"
        else
            print_warning "nvme-cli not found. Install with: sudo apt install nvme-cli"
        fi
        
        if command -v pv &> /dev/null; then
            print_status "pv found"
        else
            print_warning "pv not found. Install with: sudo apt install pv"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "macOS detected. Limited support available."
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        print_status "Windows detected. PowerShell scripts available."
    fi
}

# Display next steps
show_next_steps() {
    print_header "Setup Complete! 🎉"
    echo ""
    print_status "Next steps:"
    echo "1. Review and customize config.json if needed"
    echo "2. Change default credentials in config.json"
    echo "3. Start the application: npm start"
    echo "4. For development: npm run dev"
    echo "5. To build: npm run build"
    echo ""
    print_warning "IMPORTANT: Test with non-critical drives first!"
    echo ""
    print_status "Documentation:"
    echo "- README.md: General information"
    echo "- IMPLEMENTATION_GUIDE.md: Detailed setup guide"
    echo "- BACKEND_SUMMARY.md: Technical overview"
    echo ""
}

# Main execution
main() {
    echo "Starting TrustWipe setup..."
    echo ""
    
    check_nodejs
    echo ""
    
    install_dependencies
    echo ""
    
    setup_permissions
    echo ""
    
    check_system_requirements
    echo ""
    
    run_tests
    echo ""
    
    show_next_steps
}

# Run main function
main "$@"
