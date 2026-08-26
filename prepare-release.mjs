#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {pathToFileURL} from 'url';

const BUILD_DIR = path.resolve('build');
const PACKAGE_JSON = path.join(BUILD_DIR, 'package.json');
const ROOT_FILES = ['LICENSE', 'README.md'];
const PLACEHOLDER_PATTERN = /<@(\w+)@>/g;
const TEXT_FILE_PATTERN = /\.(?:js|cjs|mjs|ts|cts|mts|json|map)$/;

function getVersion() {
    const version = process.argv[2] ?? process.env.GITHUB_REF_NAME;

    if (version === undefined || version === '') {
        throw new Error('The version is missing. Pass it as an argument or set GITHUB_REF_NAME.');
    }

    return version;
}

/**
 * Resolves the values for the `<@placeholder@>` markers declared in `src/constants.ts`.
 */
function getConstants(version) {
    return {
        baseEndpointUrl: 'https://api.croct.io',
        maxQueryLength: '500',
        version: version,
    };
}

function findFiles(dir, pattern, fileList = []) {
    for (const file of fs.readdirSync(dir)) {
        const filePath = path.join(dir, file);

        if (fs.statSync(filePath).isDirectory()) {
            findFiles(filePath, pattern, fileList);
        } else if (pattern.test(file)) {
            fileList.push(filePath);
        }
    }

    return fileList;
}

function copyRootFiles() {
    for (const file of ROOT_FILES) {
        fs.copyFileSync(path.resolve(file), path.join(BUILD_DIR, file));
    }

    console.log(`✅ Copied ${ROOT_FILES.join(', ')}`);
}

function updateVersion(version) {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));

    pkg.version = version;

    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2));

    console.log(`✅ Set version to ${version}`);
}

function fixSourceMaps() {
    const maps = findFiles(BUILD_DIR, /\.map$/);

    for (const file of maps) {
        const content = fs.readFileSync(file, 'utf-8');

        fs.writeFileSync(file, content.replace(/\.\.\/src/g, 'src'));
    }

    console.log(`✅ Fixed source paths in ${maps.length} source map(s)`);
}

/**
 * Replaces the placeholders rather than the expressions around them, so the
 * substitution does not depend on how the bundler formats the generated code.
 */
function replaceConstants(constants) {
    for (const [name, value] of Object.entries(constants)) {
        if (typeof value !== 'string' || value === '') {
            throw new Error(`The constant "${name}" resolved to an empty value.`);
        }
    }

    const files = findFiles(BUILD_DIR, /^constants\./);

    if (files.length === 0) {
        throw new Error('No constants file found in the build directory.');
    }

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');

        fs.writeFileSync(
            file,
            content.replace(PLACEHOLDER_PATTERN, (placeholder, name) => constants[name] ?? placeholder),
        );
    }

    console.log(`✅ Replaced constants in ${files.length} file(s)`);
}

function checkPlaceholders() {
    const unresolved = [];

    for (const file of findFiles(BUILD_DIR, TEXT_FILE_PATTERN)) {
        const matches = fs.readFileSync(file, 'utf-8').matchAll(PLACEHOLDER_PATTERN);

        for (const [placeholder] of matches) {
            unresolved.push(`${path.relative(BUILD_DIR, file)}: ${placeholder}`);
        }
    }

    if (unresolved.length > 0) {
        throw new Error(`Unresolved placeholders found:\n${unresolved.join('\n')}`);
    }

    console.log('✅ No unresolved placeholders left');
}

/**
 * Checks the values the package actually exports, as a placeholder left behind
 * has already shipped a `NaN` once.
 */
async function checkConstants(version) {
    const constants = await import(pathToFileURL(path.join(BUILD_DIR, 'constants.js')).href);

    const expectations = {
        BASE_ENDPOINT_URL: value => typeof value === 'string' && URL.canParse(value),
        MAX_QUERY_LENGTH: value => Number.isInteger(value) && value > 0,
        VERSION: value => value === version,
        CLIENT_LIBRARY: value => typeof value === 'string' && value.includes(version),
    };

    for (const [name, isValid] of Object.entries(expectations)) {
        if (!isValid(constants[name])) {
            throw new Error(`The constant "${name}" is invalid: ${String(constants[name])}`);
        }
    }

    console.log(`✅ Exported constants are valid (MAX_QUERY_LENGTH=${constants.MAX_QUERY_LENGTH})`);
}

async function prepareRelease() {
    const version = getVersion();

    copyRootFiles();
    updateVersion(version);
    fixSourceMaps();
    replaceConstants(getConstants(version));
    checkPlaceholders();
    await checkConstants(version);
}

await prepareRelease();
