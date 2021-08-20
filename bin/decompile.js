#!/usr/bin/env node

const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs').promises;

const baseDir = './.github/workflows';

async function run(files) {
  if (!files.length) {
    files = (await fs.readdir(baseDir)).filter(f => path.extname(f).match(/ya?ml/));
  }

  files.forEach(async (f) => {
    console.info(`Reading compiled yaml from: ${f}`);
    const yamlContents = await fs.readFile(`${baseDir}/${f}`, { encoding: 'utf-8' });
    const jsonContents = yaml.load(yamlContents);

    const newFilename = f.replace(/\.yml$/, '.json');
    const outputFile = `${baseDir}/src/${newFilename}`;
    await fs.writeFile(outputFile, JSON.stringify(jsonContents, null, 2));
    console.info(`Wrote decompiled json to: src/${newFilename}`);
  });
}

run(process.argv.slice(2));
