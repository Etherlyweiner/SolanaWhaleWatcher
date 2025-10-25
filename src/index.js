'use strict';

const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const dotenvPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(dotenvPath)) {
      require('dotenv').config({ path: dotenvPath });
    }

    const createContext = require('./core/context');
    const createCli = require('./core/cli');

    const context = await createContext();
    const cli = createCli(context);
    await cli.run(process.argv.slice(2));
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
