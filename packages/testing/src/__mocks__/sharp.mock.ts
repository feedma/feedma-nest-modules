export const mockSharp = {
  resize: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockReturnThis(),
  // TODO: add more methods if needed
};

export default jest.fn(() => mockSharp);
