# TrustWipe Electron Application

## Overview

TrustWipe is an Electron application designed to provide a user-friendly interface for securely wiping files and directories from your system. This application leverages the power of Electron to create a cross-platform desktop application using web technologies.

## Features

- Securely delete files and directories
- User-friendly interface
- Cross-platform compatibility

## Project Structure

```
super-wipe
├── src
│   ├── main.js        # Main entry point of the application
│   ├── preload.js     # Preload script for secure API exposure
│   ├── renderer.js     # User interface logic
│   └── styles
│       └── index.css  # CSS styles for the application
├── index.html         # Main HTML file for the application
├── package.json       # NPM configuration file
├── .gitignore         # Files and directories to ignore by Git
└── README.md          # Documentation for the project
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/super-wipe.git
   ```
2. Navigate to the project directory:
   ```
   cd super-wipe
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run:

```
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
