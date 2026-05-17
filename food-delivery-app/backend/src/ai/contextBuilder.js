require('dotenv').config();
const axios = require('axios');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }));

// Weather cache — avoids hammering OpenWeatherMap (30-min TTL)
const weatherCache = { data: null, at: 0 };
const WEATHER_TTL  = 30 * 60 * 1000;

async function getWeatherContext(city = 'Mumbai') {
  const now = Date.now();
  if (weatherCache.data && now - weatherCache.at < WEATHER_TTL) return weatherCache.data;

  const key = process.env.WEATHER_API_KEY;
  const url = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5/weather';

  if (!key) return { condition: 'unknown', temp: null, description: 'Weather data unavailable' };

  try {
    const res = await axios.get(url, {
      params: { q: city, appid: key, units: 'metric' },
      timeout: 3000,
    });
    const w = res.data;
    const context = {
      condition:   w.weather?.[0]?.main?.toLowerCase() || 'clear',
      description: w.weather?.[0]?.description || '',
      temp:        Math.round(w.main?.temp ?? 25),
      humidity:    w.main?.humidity,
      city:        w.name,
    };
    weatherCache.data = context;
    weatherCache.at   = now;
    return context;
  } catch {
    return { condition: 'unknown', temp: null, description: 'Weather data unavailable' };
  }
}

function getTimeContext() {
  const now  = new Date();
  const hour = now.getHours();
  const day  = now.toLocaleDateString('en-US', { weekday: 'long' });

  let meal;
  if (hour >= 6  && hour < 11) meal = 'breakfast';
  else if (hour >= 11 && hour < 15) meal = 'lunch';
  else if (hour >= 15 && hour < 18) meal = 'snack';
  else if (hour >= 18 && hour < 22) meal = 'dinner';
  else meal = 'late-night snack';

  return { hour, day, meal, isWeekend: now.getDay() === 0 || now.getDay() === 6 };
}

async function getOrderHistory(userId) {
  if (!userId) return [];

  try {
    const res = await dynamo.send(new QueryCommand({
      TableName: process.env.ORDERS_TABLE || 'Orders',
      IndexName: 'customerId-index',
      KeyConditionExpression: 'customerId = :cid',
      ExpressionAttributeValues: { ':cid': userId },
      Limit: 10,
      ScanIndexForward: false,
    }));

    return (res.Items || []).flatMap((order) =>
      (order.items || []).map((i) => ({ name: i.name, category: i.category, price: i.price }))
    );
  } catch {
    return [];
  }
}

async function buildContext({ userId, city } = {}) {
  const [time, weather, orderHistory] = await Promise.all([
    getTimeContext(),
    getWeatherContext(city),
    getOrderHistory(userId),
  ]);

  return { time, weather, orderHistory };
}

module.exports = { buildContext, getTimeContext, getWeatherContext, getOrderHistory };
