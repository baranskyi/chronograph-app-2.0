import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { Server } from 'socket.io'
import { roomRoutes } from './routes/rooms.js'
import { stripeRoutes } from './routes/stripe.js'
import { contactRoutes } from './routes/contact.js'
import { initializeSocket } from './socket/handlers.js'
import { config } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'info' : 'debug'
    }
  })

  // CORS
  await fastify.register(cors, {
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
    credentials: true
  })

  // REST routes
  await fastify.register(roomRoutes, { prefix: '/api' })
  await fastify.register(stripeRoutes, { prefix: '/api/stripe' })
  await fastify.register(contactRoutes, { prefix: '/api' })

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: Date.now() }))

  // Serve static files in production
  if (config.nodeEnv === 'production') {
    const distPath = join(__dirname, '../../dist')

    await fastify.register(fastifyStatic, {
      root: distPath,
      prefix: '/'
    })

    // SPA fallback - serve index.html for all non-API routes
    fastify.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api') || request.url.startsWith('/socket.io')) {
        return reply.status(404).send({ error: 'Not found' })
      }
      return reply.sendFile('index.html')
    })
  }

  // Start HTTP server first
  await fastify.listen({ port: config.port, host: '0.0.0.0' })

  // Attach Socket.io to the HTTP server
  const io = new Server(fastify.server, {
    cors: {
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
      credentials: true
    },
    path: '/socket.io'
  })

  initializeSocket(io)

  console.log(`Server running on port ${config.port}`)
  console.log(`Environment: ${config.nodeEnv}`)
  console.log(`CORS origin: ${config.corsOrigin}`)
  if (config.nodeEnv === 'production') {
    console.log('Serving static files from dist/')
  }
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
