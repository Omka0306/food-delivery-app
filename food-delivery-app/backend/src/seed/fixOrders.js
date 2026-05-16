require('dotenv').config()
const { ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb')
const { docClient } = require('../config/dynamodb')

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders'
const RESTAURANT_ID = 'ddb6d8ad-c007-4fff-8d62-3f13064d4725'

async function fixOrders() {
  console.log(`Scanning all orders in "${ORDERS_TABLE}"...`)

  const result = await docClient.send(new ScanCommand({ TableName: ORDERS_TABLE }))
  const allOrders = result.Items || []
  // Fix orders with null restaurantId OR with the old wrong ID from seed
  const OLD_ID = 'ef250fe0-3aaa-4114-ab95-5c01f7c03ff0'
  const broken = allOrders.filter((o) => !o.restaurantId || o.restaurantId === OLD_ID)

  console.log(`Total orders: ${allOrders.length}  |  Missing restaurantId: ${broken.length}`)

  if (broken.length === 0) {
    console.log('Nothing to fix.')
    return
  }

  for (const order of broken) {
    await docClient.send(
      new UpdateCommand({
        TableName: ORDERS_TABLE,
        Key: { orderId: order.orderId },
        UpdateExpression: 'SET restaurantId = :rid',
        ExpressionAttributeValues: { ':rid': RESTAURANT_ID },
      })
    )
    console.log(`  [FIXED] ${order.orderId} — ${order.customerName}`)
  }

  console.log(`\nDone. ${broken.length} order(s) updated.`)
}

fixOrders().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
