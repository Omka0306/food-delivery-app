require('dotenv').config();
const {
  OpenSearchServerlessClient,
  CreateCollectionCommand,
  BatchGetCollectionCommand,
  CreateSecurityPolicyCommand,
  CreateAccessPolicyCommand,
  GetSecurityPolicyCommand,
  GetAccessPolicyCommand,
} = require('@aws-sdk/client-opensearchserverless');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const { createIndex } = require('../ai/opensearch');

const client    = new OpenSearchServerlessClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const stsClient = new STSClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const COLLECTION_NAME = 'quickbite-menu';

async function getAccountId() {
  const res = await stsClient.send(new GetCallerIdentityCommand({}));
  return res.Account;
}

async function ensureEncryptionPolicy() {
  const policyName = `${COLLECTION_NAME}-enc`;
  try {
    await client.send(new GetSecurityPolicyCommand({ name: policyName, type: 'encryption' }));
    console.log(`  Encryption policy already exists: ${policyName}`);
  } catch {
    await client.send(new CreateSecurityPolicyCommand({
      name: policyName,
      type: 'encryption',
      policy: JSON.stringify({
        Rules: [{ Resource: [`collection/${COLLECTION_NAME}`], ResourceType: 'collection' }],
        AWSOwnedKey: true,
      }),
    }));
    console.log(`  Created encryption policy: ${policyName}`);
  }
}

async function ensureNetworkPolicy() {
  const policyName = `${COLLECTION_NAME}-net`;
  try {
    await client.send(new GetSecurityPolicyCommand({ name: policyName, type: 'network' }));
    console.log(`  Network policy already exists: ${policyName}`);
  } catch {
    await client.send(new CreateSecurityPolicyCommand({
      name: policyName,
      type: 'network',
      policy: JSON.stringify([{
        Rules: [
          { Resource: [`collection/${COLLECTION_NAME}`], ResourceType: 'collection' },
          { Resource: [`collection/${COLLECTION_NAME}`], ResourceType: 'dashboard' },
        ],
        AllowFromPublic: true,
      }]),
    }));
    console.log(`  Created network policy: ${policyName}`);
  }
}

async function ensureDataAccessPolicy(accountId) {
  const policyName = `${COLLECTION_NAME}-access`;
  try {
    await client.send(new GetAccessPolicyCommand({ name: policyName, type: 'data' }));
    console.log(`  Data access policy already exists: ${policyName}`);
  } catch {
    await client.send(new CreateAccessPolicyCommand({
      name: policyName,
      type: 'data',
      policy: JSON.stringify([{
        Rules: [
          {
            Resource: [`index/${COLLECTION_NAME}/*`],
            Permission: [
              'aoss:CreateIndex', 'aoss:DeleteIndex', 'aoss:UpdateIndex',
              'aoss:DescribeIndex', 'aoss:ReadDocument', 'aoss:WriteDocument',
            ],
            ResourceType: 'index',
          },
          {
            Resource: [`collection/${COLLECTION_NAME}`],
            Permission: ['aoss:CreateCollectionItems', 'aoss:DeleteCollectionItems', 'aoss:UpdateCollectionItems', 'aoss:DescribeCollectionItems'],
            ResourceType: 'collection',
          },
        ],
        Principal: [
          `arn:aws:iam::${accountId}:root`,
        ],
      }]),
    }));
    console.log(`  Created data access policy: ${policyName}`);
  }
}

async function waitForCollection(name, maxWaitMs = 8 * 60 * 1000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const res = await client.send(new BatchGetCollectionCommand({ names: [name] }));
    const col = res.collectionDetails?.[0];
    if (col?.status === 'ACTIVE') return col.collectionEndpoint;
    console.log(`  Collection status: ${col?.status || 'creating'} — waiting 15s...`);
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error(`Collection ${name} did not become ACTIVE within timeout`);
}

async function main() {
  console.log('Setting up OpenSearch Serverless...\n');

  const accountId = await getAccountId();
  console.log(`AWS Account: ${accountId}`);

  // Create required security policies
  console.log('\nCreating security policies...');
  await ensureEncryptionPolicy();
  await ensureNetworkPolicy();
  await ensureDataAccessPolicy(accountId);

  // Create or find collection
  console.log('\nChecking collection...');
  let endpoint;
  const existing = await client.send(new BatchGetCollectionCommand({ names: [COLLECTION_NAME] }));
  const col = existing.collectionDetails?.[0];

  if (col?.status === 'ACTIVE') {
    endpoint = col.collectionEndpoint;
    console.log(`  Collection already active: ${endpoint}`);
  } else if (col) {
    console.log(`  Collection exists with status: ${col.status} — waiting for ACTIVE`);
    endpoint = await waitForCollection(COLLECTION_NAME);
  } else {
    console.log(`  Creating collection: ${COLLECTION_NAME}`);
    await client.send(new CreateCollectionCommand({
      name: COLLECTION_NAME,
      type: 'VECTORSEARCH',
      description: 'QuickBite menu embeddings for AI meal assistant',
    }));
    endpoint = await waitForCollection(COLLECTION_NAME);
  }

  console.log(`\nCollection active: ${endpoint}`);
  console.log(`\nAdd this to your .env:\nOPENSEARCH_ENDPOINT=${endpoint}\n`);

  // Create KNN index if endpoint is configured
  const configuredEndpoint = process.env.OPENSEARCH_ENDPOINT;
  if (configuredEndpoint && !configuredEndpoint.includes('your-collection-id')) {
    console.log('Creating KNN index...');
    await createIndex();
    console.log('KNN index ready.');
  } else {
    console.log(`Run again after adding OPENSEARCH_ENDPOINT=${endpoint} to .env`);
  }
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
