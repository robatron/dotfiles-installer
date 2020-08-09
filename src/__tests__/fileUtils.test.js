const path = require('path');
const { fileExists } = require('../fileUtils');

describe('fileExists', () => {
    it('returns true if a file exists', () => {
        const targetFilePath = path.join(__dirname, 'index.test.js');
        expect(fileExists(targetFilePath)).toBe(true);
    });

    it('returns false if a file does not exist', () => {
        const targetFilePath = path.join(__dirname, 'non-existant-file.ext');
        expect(fileExists(targetFilePath)).toBe(false);
    });
});
