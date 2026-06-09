import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    counter: {
      create: jest.fn(),
      count: jest.fn(),
    },
  })),
}));

import fastify from 'fastify';

function buildServer() {
  const prisma = new PrismaClient();
  const server = fastify();

  server.get('/ping', async (_, reply) => {
    try {
      await prisma.counter.create({ data: {} });
      const count = await prisma.counter.count();
      return reply.status(200).send({ count });
    } catch (error: any) {
      return reply.status(500).send({ error: error?.message });
    }
  });

  return { server, prisma };
}

describe('GET /ping', () => {
  it('should return 200 with the count', async () => {
    const { server, prisma } = buildServer();

    (prisma.counter.count as jest.Mock).mockResolvedValue(42);

    const response = await server.inject({
      method: 'GET',
      url: '/ping',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ count: 42 });
  });

  it('should return 500 when Prisma throws', async () => {
    const { server, prisma } = buildServer();

    (prisma.counter.create as jest.Mock).mockRejectedValue(
      new Error('DB connection failed')
    );

    const response = await server.inject({
      method: 'GET',
      url: '/ping',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: 'DB connection failed' });
  });
});
