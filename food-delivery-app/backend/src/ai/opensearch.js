require('dotenv').config();
const { Client } = require('@opensearch-project/opensearch');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');

let _client = null;

function getClient() {
  if (_client) return _client;

  const endpoint = process.env.OPENSEARCH_ENDPOINT;
  if (!endpoint) throw new Error('OPENSEARCH_ENDPOINT env var not set');

  _client = new Client({
    ...AwsSigv4Signer({
      region: process.env.AWS_REGION || 'ap-south-1',
      service: 'aoss',
      getCredentials: defaultProvider(),
    }),
    node: endpoint,
    requestTimeout: 10000,
  });

  return _client;
}

const INDEX = process.env.OPENSEARCH_INDEX || 'menu-embeddings';

async function createIndex() {
  const client = getClient();
  const exists = await client.indices.exists({ index: INDEX });
  if (exists.body) return;

  await client.indices.create({
    index: INDEX,
    body: {
      settings: {
        'index.knn': true,
        number_of_shards: 1,
        number_of_replicas: 0,
      },
      mappings: {
        properties: {
          menuItemId:   { type: 'keyword' },
          restaurantId: { type: 'keyword' },
          name:         { type: 'text' },
          category:     { type: 'keyword' },
          description:  { type: 'text' },
          price:        { type: 'float' },
          isVeg:        { type: 'boolean' },
          spiceLevel:   { type: 'integer' },
          calories:     { type: 'integer' },
          healthScore:  { type: 'integer' },
          tags:         { type: 'keyword' },
          moodTags:     { type: 'keyword' },
          bestFor:      { type: 'keyword' },
          weatherTags:  { type: 'keyword' },
          allergens:    { type: 'keyword' },
          rating:       { type: 'float' },
          available:    { type: 'boolean' },
          embedding: {
            type: 'knn_vector',
            dimension: 1536,
            method: {
              name:       'hnsw',
              engine:     'nmslib',
              space_type: 'innerproduct',
              parameters: { ef_construction: 128, m: 16 },
            },
          },
        },
      },
    },
  });
  console.log(`Created OpenSearch index: ${INDEX}`);
}

async function indexDocument(doc) {
  const client = getClient();
  // OpenSearch Serverless does not support client-specified document IDs in index requests.
  // We store menuItemId inside the document body and rely on KNN search to retrieve it.
  return client.index({
    index: INDEX,
    body:  doc,
  });
}

async function knnSearch({ embedding, size = 5, filters = {} }) {
  const client = getClient();

  const must = [{ knn: { embedding: { vector: embedding, k: size * 3 } } }];
  const filter = [];

  if (filters.isVeg === true)  filter.push({ term: { isVeg: true } });
  if (filters.category)        filter.push({ term: { category: filters.category } });
  if (filters.maxPrice)        filter.push({ range: { price: { lte: filters.maxPrice } } });
  if (filters.maxCalories)     filter.push({ range: { calories: { lte: filters.maxCalories } } });
  if (filters.maxSpice != null) filter.push({ range: { spiceLevel: { lte: filters.maxSpice } } });
  if (filters.allergenFree?.length) {
    filter.push({ bool: { must_not: { terms: { allergens: filters.allergenFree } } } });
  }

  filter.push({ term: { available: true } });

  const query = filter.length
    ? { bool: { must, filter } }
    : { bool: { must } };

  const res = await client.search({
    index: INDEX,
    body: { size, query, _source: { excludes: ['embedding'] } },
  });

  return res.body.hits.hits.map((h) => ({ ...h._source, _score: h._score }));
}

module.exports = { getClient, createIndex, indexDocument, knnSearch, INDEX };
