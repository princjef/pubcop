const fs = require('fs');

const files = process.argv.slice(2);

for (const file of files) {
    fs.chmodSync(file, 0o755);
}
