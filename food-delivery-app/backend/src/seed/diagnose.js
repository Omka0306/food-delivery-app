require('dotenv').config()
const { ScanCommand } = require('@aws-sdk/lib-dynamodb')
const { docClient } = require('../config/dynamodb')

async function diagnose() {
  const [restaurants, profiles, orders] = await Promise.all([
    docClient.send(new ScanCommand({ TableName: 'Restaurants' })),
    docClient.send(new ScanCommand({
      TableName: 'UserProfiles',
      FilterExpression: '#r = :role',
      ExpressionAttributeNames: { '#r': 'role' },
      ExpressionAttributeValues: { ':role': 'restaurant' },
    })),
    docClient.send(new ScanCommand({ TableName: 'Orders' })),
  ])

  console.log('\n── RESTAURANTS ──')
  for (const r of restaurants.Items || []) {
    console.log(`  restaurantId: ${r.restaurantId}  name: ${r.name}  status: ${r.status}`)
  }

  console.log('\n── RESTAURANT USER PROFILES ──')
  for (const p of profiles.Items || []) {
    console.log(`  userId: ${p.userId}  email: ${p.email}  restaurantId: ${p.restaurantId}`)
  }

  console.log('\n── ORDERS (restaurantId column) ──')
  const ordersSorted = (orders.Items || []).sort((a, b) => b.createdAt > a.createdAt ? 1 : -1)
  for (const o of ordersSorted) {
    console.log(`  orderId: ...${o.orderId.slice(-8)}  customer: ${o.customerName}  restaurantId: ${o.restaurantId}`)
  }

  console.log('\n── SUMMARY ──')
  const restaurantIds = new Set((restaurants.Items || []).map(r => r.restaurantId))
  const profileRestaurantIds = new Set((profiles.Items || []).map(p => p.restaurantId))
  const orderRestaurantIds = new Set((orders.Items || []).map(o => o.restaurantId))

  console.log('Restaurant table IDs:', [...restaurantIds])
  console.log('User profile IDs:    ', [...profileRestaurantIds])
  console.log('Order IDs in use:    ', [...orderRestaurantIds])

  const matchingOrders = (orders.Items || []).filter(o =>
    restaurantIds.has(o.restaurantId) && profileRestaurantIds.has(o.restaurantId)
  )
  console.log(`\nOrders matching both restaurant AND user profile: ${matchingOrders.length} / ${(orders.Items || []).length}`)
}

diagnose().catch(err => { console.error(err.message); process.exit(1) })
