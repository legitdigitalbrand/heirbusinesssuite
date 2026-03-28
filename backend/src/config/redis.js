import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
});

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

await client.connect();

export const getRedisClient = () => client;

export default client;
