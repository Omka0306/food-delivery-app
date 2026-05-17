const COGNITO_ERROR_MAP = {
  UsernameExistsException:      { status: 409, code: 'USER_EXISTS',        message: 'An account with this email already exists.' },
  NotAuthorizedException:       { status: 401, code: 'UNAUTHORIZED',       message: 'Incorrect email or password.' },
  UserNotConfirmedException:    { status: 403, code: 'NOT_CONFIRMED',      message: 'Account not verified. Please check your email.' },
  CodeMismatchException:        { status: 400, code: 'INVALID_CODE',       message: 'Invalid verification code. Please try again.' },
  ExpiredCodeException:         { status: 400, code: 'EXPIRED_CODE',       message: 'Verification code has expired. Please request a new one.' },
  UserNotFoundException:        { status: 404, code: 'USER_NOT_FOUND',     message: 'No account found with this email.' },
  LimitExceededException:       { status: 429, code: 'RATE_LIMITED',       message: 'Too many attempts. Please try again later.' },
  TooManyRequestsException:     { status: 429, code: 'RATE_LIMITED',       message: 'Too many requests. Please try again later.' },
  InvalidPasswordException:     { status: 400, code: 'INVALID_PASSWORD',   message: 'Password does not meet the requirements.' },
  InvalidParameterException:    { status: 400, code: 'INVALID_PARAMETER',  message: null },
};

function errorHandler(err, req, res, _next) {
  console.error(err.stack || err.message);

  const cognitoError = COGNITO_ERROR_MAP[err.name];
  if (cognitoError) {
    return res.status(cognitoError.status).json({
      success: false,
      error: {
        code: cognitoError.code,
        message: cognitoError.message || err.message,
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

module.exports = errorHandler;
