// Add more methods when needed
// don't forget add it in tne class as well because signature must match
export const mockModel = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

export class MongoModel {
  static construct = jest.fn();
  constructor(private data?: unknown) {
    MongoModel.construct(data);
    return mockModel;
  }
  save = jest.fn();
  static create = jest.fn();
  static findOne = jest.fn().mockResolvedValue(mockModel);
}
