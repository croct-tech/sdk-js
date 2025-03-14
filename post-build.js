#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, 'build');
const PACKAGE_JSON = path.resolve(__dirname, 'package.json');

function findIndexFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            findIndexFiles(filePath, fileList);
        } else if (/^index\.(js|mjs|cjs|ts)$/.test(file)) {
            fileList.push(filePath);
        }
    }

    return fileList;
}

function updateExports() {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
    const indexFiles = findIndexFiles(BUILD_DIR);

    pkg.exports = pkg.exports || {};

    for (const file of indexFiles) {
        const relativeDir = `./${path.relative(BUILD_DIR, path.dirname(file)).replace(/\\/g, '/')}`;
        const relativeFile = `./${path.relative(BUILD_DIR, file).replace(/\\/g, '/')}`;

        if (pkg.exports[relativeDir] === undefined) {
            pkg.exports[relativeDir] = {
                import: {},
                require: {},
            };
        }

        if (file.endsWith('.mjs')) {
            pkg.exports[relativeDir].import = relativeFile;
        } else {
            pkg.exports[relativeDir].require = relativeFile;
        }
    }

    fs.writeFileSync(path.join(BUILD_DIR, 'package.json'), JSON.stringify(pkg, null, 2));

    console.log('✅ Updated package.json exports');
}

updateExports();
