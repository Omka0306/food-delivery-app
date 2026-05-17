require('dotenv').config();
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function tableExists(name) {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch {
    return false;
  }
}

async function createTableIfNeeded(params) {
  const exists = await tableExists(params.TableName);
  if (exists) {
    console.log(`  Table already exists: ${params.TableName}`);
    return;
  }
  await client.send(new CreateTableCommand(params));
  console.log(`  Created: ${params.TableName}`);
}

async function main() {
  console.log('Creating AI DynamoDB tables...\n');

  await createTableIfNeeded({
    TableName: process.env.AI_INTERACTIONS_TABLE || 'AIInteractions',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'interactionId', AttributeType: 'S' },
      { AttributeName: 'userId',        AttributeType: 'S' },
      { AttributeName: 'createdAt',     AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'interactionId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-createdAt-index',
        KeySchema: [
          { AttributeName: 'userId',    KeyType: 'HASH'  },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    TimeToLiveSpecification: { AttributeName: 'ttl', Enabled: true },
  });

  await createTableIfNeeded({
    TableName: process.env.USER_AI_PROFILES_TABLE || 'UserAIProfiles',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
  });

  console.log('\nDone.');
}

main().catch((err) => { console.error(err); process.exit(1); });
