const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const TABLE = process.env.USER_PROFILES_TABLE || 'UserProfiles';

async function getAddresses(userId) {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { userId } })
  );
  return result.Item?.savedAddresses || [];
}

async function saveAddresses(userId, addresses) {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId },
      UpdateExpression: 'SET savedAddresses = :addresses, updatedAt = :now',
      ExpressionAttributeValues: {
        ':addresses': addresses,
        ':now': new Date().toISOString(),
      },
    })
  );
}

async function addAddress(userId, { label, name, phone, addressLine, isDefault }) {
  const current = await getAddresses(userId);
  const isFirst = current.length === 0;
  const makeDefault = isFirst || !!isDefault;

  const newAddr = {
    addressId: uuidv4(),
    label: label || 'Home',
    name,
    phone,
    addressLine,
    isDefault: makeDefault,
  };

  const updated = makeDefault
    ? [...current.map((a) => ({ ...a, isDefault: false })), newAddr]
    : [...current, newAddr];

  await saveAddresses(userId, updated);
  return newAddr;
}

async function updateAddress(userId, addressId, updates) {
  const current = await getAddresses(userId);
  const updated = current.map((a) => {
    if (a.addressId !== addressId) {
      return updates.isDefault ? { ...a, isDefault: false } : a;
    }
    return { ...a, ...updates, addressId };
  });
  await saveAddresses(userId, updated);
  return updated.find((a) => a.addressId === addressId);
}

async function deleteAddress(userId, addressId) {
  const current = await getAddresses(userId);
  const removed = current.find((a) => a.addressId === addressId);
  let updated = current.filter((a) => a.addressId !== addressId);
  // Promote first remaining address to default if the deleted one was default
  if (removed?.isDefault && updated.length > 0) {
    updated[0] = { ...updated[0], isDefault: true };
  }
  await saveAddresses(userId, updated);
  return { deleted: true };
}

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };
