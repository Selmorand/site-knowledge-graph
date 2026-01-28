const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

// Register paths for runtime (dist/ instead of src/)
tsConfigPaths.register({
  baseUrl: path.resolve(__dirname, 'dist'),
  paths: {
    '@/*': ['./*']
  }
});
