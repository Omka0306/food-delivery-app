const { CognitoJwtVerifier } = require('aws-jwt-verify');

let verifier = null;

function getVerifier() {
  if (!verifier) {
    if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) {
      throw new Error('COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set');
    }
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      tokenUse: 'id',
      clientId: process.env.COGNITO_CLIENT_ID,
    });
  }
  return verifier;
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' },
    });
  }

  const token = authHeader.slice(7);
  try {
    const payload = await getVerifier().verify(token);
    req.user = {
      userId: payload.sub,
      email: payload.email,
      name: payload.name || payload['cognito:username'] || payload.email,
      role: payload['custom:role'] || (payload['cognito:groups'] || ['customer'])[0],
      restaurantId: payload['custom:restaurantId'] || null,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${roles.join(' or ')}`,
        },
      });
    }
    next();
  };
}

function requireRestaurantOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }
  if (req.user.role === 'admin') return next();
  if (req.user.restaurantId && req.user.restaurantId === req.params.restaurantId) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: { code: 'FORBIDDEN', message: 'Access denied to this restaurant' },
  });
}

// Allow both auth modes: optional (sets req.user if token present) vs required
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  return verifyToken(req, res, next);
}

module.exports = { verifyToken, requireRole, requireRestaurantOwner, optionalAuth };
