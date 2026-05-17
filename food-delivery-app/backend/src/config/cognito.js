const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-south-1',
});

module.exports = { cognitoClient };
