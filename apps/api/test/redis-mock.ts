import RedisMock from 'ioredis-mock';

export function createRedisMock() {
  return new RedisMock();
}
