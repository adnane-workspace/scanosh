import { ApiError } from '../../src/utils/ApiError.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

function mockRes() {
  return {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('ApiError', () => {
  test('includes code in JSON responses', () => {
    const res = mockRes();
    errorHandler(new ApiError(403, 'This cafe is disabled', null, 'CAFE_DISABLED'), {}, res, () => {});

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      code: 'CAFE_DISABLED',
      message: 'This cafe is disabled',
    });
  });

  test('includes details for parameterized errors', () => {
    const res = mockRes();
    errorHandler(new ApiError(400, 'Maximum 3 category levels', { max: 3 }, 'CATEGORY_MAX_DEPTH'), {}, res, () => {});

    expect(res.body.code).toBe('CATEGORY_MAX_DEPTH');
    expect(res.body.details).toEqual({ max: 3 });
  });

  test('maps Prisma unique conflicts to 409', () => {
    const res = mockRes();
    errorHandler({ code: 'P2002', meta: { target: ['slug'] }, message: 'Unique constraint' }, {}, res, () => {});

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('SLUG_IN_USE');
  });

  test('maps oversized uploads to IMAGE_TOO_LARGE', () => {
    const res = mockRes();
    errorHandler({ name: 'MulterError', code: 'LIMIT_FILE_SIZE' }, {}, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('IMAGE_TOO_LARGE');
  });
});
