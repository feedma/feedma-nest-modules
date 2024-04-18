import { createWriteStream, createReadStream } from 'fs';

export const mockBuffer = Buffer.from('This is a test file', 'utf-8');
export const mockWriteStream = {
  on: jest.fn().mockImplementation(function (this: typeof createWriteStream, event, handler) {
    if (event === 'finish') {
      handler();
    }
    return this;
  }),
};

export const mockReadStream = {
  on: jest.fn().mockImplementation(function (this: typeof createReadStream, event, handler) {
    if (event === 'finish') {
      handler();
    }
    return this;
  }),
};
