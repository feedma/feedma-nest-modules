import { isSuccessHttpCode } from './is-success-http-code.helper';

describe('isSuccessHttpCode', () => {
  it('should return true for status codes in the range 200-299', () => {
    expect(isSuccessHttpCode(200)).toBe(true);
    expect(isSuccessHttpCode(204)).toBe(true);
    expect(isSuccessHttpCode(299)).toBe(true);
  });

  it('should return false for status codes outside the range 200-299', () => {
    expect(isSuccessHttpCode(100)).toBe(false);
    expect(isSuccessHttpCode(400)).toBe(false);
    expect(isSuccessHttpCode(500)).toBe(false);
  });

  it('should return false for edge cases', () => {
    expect(isSuccessHttpCode(199)).toBe(false);
    expect(isSuccessHttpCode(300)).toBe(false);
    expect(isSuccessHttpCode(999)).toBe(false);
  });
});
