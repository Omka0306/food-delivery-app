const {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  ResendConfirmationCodeCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { cognitoClient } = require('../config/cognito');
const { docClient } = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE || 'UserProfiles';
const RESTAURANTS_TABLE = process.env.RESTAURANTS_TABLE || 'Restaurants';

async function deleteUnconfirmedCognitoUser(email) {
  try {
    const user = await cognitoClient.send(
      new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email })
    );
    if (user.UserStatus === 'UNCONFIRMED') {
      await cognitoClient.send(
        new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: email })
      );
    }
  } catch (_) { /* swallow cleanup errors */ }
}

async function register({ email, password, name, phone }) {
  let signUpResult;
  try {
    signUpResult = await cognitoClient.send(
      new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
          { Name: 'custom:role', Value: 'customer' },
        ],
      })
    );
  } catch (err) {
    if (err.name === 'UsernameExistsException') {
      await deleteUnconfirmedCognitoUser(email);
      signUpResult = await cognitoClient.send(
        new SignUpCommand({
          ClientId: CLIENT_ID,
          Username: email,
          Password: password,
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'name', Value: name },
            { Name: 'custom:role', Value: 'customer' },
          ],
        })
      );
    } else {
      throw err;
    }
  }

  const userId = signUpResult.UserSub;
  const now = new Date().toISOString();

  await docClient.send(
    new PutCommand({
      TableName: USER_PROFILES_TABLE,
      Item: {
        userId,
        email,
        name,
        phone,
        role: 'customer',
        status: 'unverified',
        createdAt: now,
        updatedAt: now,
      },
    })
  );

  return { message: 'Registration successful. Check your email for a verification code.' };
}

async function registerRestaurant({
  email,
  password,
  name,
  phone,
  restaurantName,
  cuisine,
  address,
  description,
}) {
  let signUpResult;
  try {
    signUpResult = await cognitoClient.send(
      new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
          { Name: 'custom:role', Value: 'restaurant' },
        ],
      })
    );
  } catch (err) {
    if (err.name === 'UsernameExistsException') {
      await deleteUnconfirmedCognitoUser(email);
      signUpResult = await cognitoClient.send(
        new SignUpCommand({
          ClientId: CLIENT_ID,
          Username: email,
          Password: password,
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'name', Value: name },
            { Name: 'custom:role', Value: 'restaurant' },
          ],
        })
      );
    } else {
      throw err;
    }
  }

  const userId = signUpResult.UserSub;
  const restaurantId = uuidv4();
  const now = new Date().toISOString();

  await docClient.send(
    new PutCommand({
      TableName: RESTAURANTS_TABLE,
      Item: {
        restaurantId,
        name: restaurantName,
        cuisine,
        address,
        description: description || '',
        phone,
        email,
        ownerId: userId,
        status: 'pending',
        rating: 0,
        totalOrders: 0,
        revenue: 0,
        isOpen: false,
        createdAt: now,
        updatedAt: now,
      },
    })
  );

  await cognitoClient.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [{ Name: 'custom:restaurantId', Value: restaurantId }],
    })
  );

  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      GroupName: 'restaurant',
    })
  );

  await docClient.send(
    new PutCommand({
      TableName: USER_PROFILES_TABLE,
      Item: {
        userId,
        email,
        name,
        phone,
        role: 'restaurant',
        restaurantId,
        status: 'unverified',
        createdAt: now,
        updatedAt: now,
      },
    })
  );

  return {
    message: 'Restaurant registration successful. Check your email for a verification code.',
    restaurantId,
  };
}

async function verify({ email, code }) {
  await cognitoClient.send(
    new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    })
  );
  return { message: 'Email verified successfully. You can now log in.' };
}

async function login({ email, password }) {
  const result = await cognitoClient.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    })
  );

  const { IdToken, AccessToken, RefreshToken } = result.AuthenticationResult;
  return { idToken: IdToken, accessToken: AccessToken, refreshToken: RefreshToken };
}

async function refresh({ refreshToken }) {
  const result = await cognitoClient.send(
    new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    })
  );

  const { IdToken, AccessToken } = result.AuthenticationResult;
  return { idToken: IdToken, accessToken: AccessToken };
}

async function logout({ accessToken }) {
  await cognitoClient.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
  return { message: 'Logged out successfully.' };
}

async function resendVerification({ email }) {
  await cognitoClient.send(
    new ResendConfirmationCodeCommand({ ClientId: CLIENT_ID, Username: email })
  );
  return { message: 'Verification code resent.' };
}

async function getMe(userId) {
  const result = await docClient.send(
    new GetCommand({ TableName: USER_PROFILES_TABLE, Key: { userId } })
  );
  return result.Item || null;
}

module.exports = {
  register,
  registerRestaurant,
  verify,
  login,
  refresh,
  logout,
  resendVerification,
  getMe,
};
