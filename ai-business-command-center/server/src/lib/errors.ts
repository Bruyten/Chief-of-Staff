// Custom error class so route handlers can `throw new HttpError(402, "Out of credits")`
// and the error middleware turns it into a clean JSON response.

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = "ERROR") {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "HttpError";
  }
}

export const errors = {
  badRequest: (m = "Bad request")        => new HttpError(400, m, "BAD_REQUEST"),
  unauthorized: (m = "Unauthorized")     => new HttpError(401, m, "UNAUTHORIZED"),
  paymentRequired: (m = "Out of credits")=> new HttpError(402, m, "OUT_OF_CREDITS"),
  forbidden: (m = "Forbidden")           => new HttpError(403, m, "FORBIDDEN"),
  notFound: (m = "Not found")            => new HttpError(404, m, "NOT_FOUND"),
  conflict: (m = "Conflict")             => new HttpError(409, m, "CONFLICT"),
  tooMany: (m = "Too many requests")     => new HttpError(429, m, "RATE_LIMITED"),
  server: (m = "Internal server error")  => new HttpError(500, m, "SERVER_ERROR"),
};
