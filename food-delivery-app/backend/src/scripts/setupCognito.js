require('dotenv').config();
const {
  CognitoIdentityProviderClient,
  CreateUserPoolCommand,
  CreateUserPoolClientCommand,
  CreateGroupCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION || 'ap-south-1',
});

async function run() {
  console.log('Creating Cognito User Pool: QuickBiteUserPool...');

  const poolResult = await client.send(
    new CreateUserPoolCommand({
      PoolName: 'QuickBiteUserPool',
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: true,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: false,
        },
      },
      Schema: [
        {
          Name: 'email',
          AttributeDataType: 'String',
          Required: true,
          Mutable: true,
        },
        {
          Name: 'role',
          AttributeDataType: 'String',
          Required: false,
          Mutable: true,
          StringAttributeConstraints: { MinLength: '1', MaxLength: '20' },
        },
        {
          Name: 'restaurantId',
          AttributeDataType: 'String',
          Required: false,
          Mutable: true,
          StringAttributeConstraints: { MinLength: '0', MaxLength: '50' },
        },
      ],
      AutoVerifiedAttributes: ['email'],
      UsernameAttributes: ['email'],
      UserPoolTags: { Project: 'QuickBite' },
    })
  );

  const userPoolId = poolResult.UserPool.Id;
  console.log('\nUSER_POOL_ID:', userPoolId);

  const clientResult = await client.send(
    new CreateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientName: 'QuickBiteClient',
      GenerateSecret: false,
      ExplicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
        'ALLOW_USER_SRP_AUTH',
      ],
      AccessTokenValidity: 60,
      RefreshTokenValidity: 30,
      TokenValidityUnits: {
        AccessToken: 'minutes',
        RefreshToken: 'days',
      },
      PreventUserExistenceErrors: 'ENABLED',
    })
  );

  const clientId = clientResult.UserPoolClient.ClientId;
  console.log('CLIENT_ID:', clientId);

  const groups = [
    { GroupName: 'admin', Description: 'Platform administrators', Precedence: 1 },
    { GroupName: 'restaurant', Description: 'Restaurant owners and staff', Precedence: 2 },
    { GroupName: 'customer', Description: 'Customers placing orders', Precedence: 3 },
  ];

  console.log('\nCreating user pool groups...');
  for (const group of groups) {
    await client.send(
      new CreateGroupCommand({ UserPoolId: userPoolId, ...group })
    );
    console.log(`  [OK] Group "${group.GroupName}" created`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('Add these to your .env file:');
  console.log(`COGNITO_USER_POOL_ID=${userPoolId}`);
  console.log(`COGNITO_CLIENT_ID=${clientId}`);
  console.log('═══════════════════════════════════════');
}

run().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
