import type { FastifyPluginAsync } from 'fastify'
import { roomManager } from '../services/roomManager.js'

export const roomRoutes: FastifyPluginAsync = async (fastify) => {
  // Check if room exists (for viewer validation)
  fastify.get<{ Params: { roomId: string } }>('/rooms/:roomId', async (request, reply) => {
    const { roomId } = request.params
    const room = roomManager.getRoom(roomId)

    if (!room) {
      return reply.status(404).send({ error: 'Room not found' })
    }

    const timers = roomManager.getTimers(roomId)

    return {
      roomId: room.roomId,
      hasController: !!room.controllerSocketId,
      timerCount: timers.length,
      activeTimerId: room.activeTimerId,
      timers: timers.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        isOnAir: t.isOnAir
      }))
    }
  })

  // Get timers for a room
  fastify.get<{ Params: { roomId: string } }>('/rooms/:roomId/timers', async (request, reply) => {
    const { roomId } = request.params
    const room = roomManager.getRoom(roomId)

    if (!room) {
      return reply.status(404).send({ error: 'Room not found' })
    }

    const timers = roomManager.getTimers(roomId)
    return {
      timers,
      activeTimerId: room.activeTimerId
    }
  })

  // Get specific timer
  fastify.get<{ Params: { roomId: string; timerId: string } }>(
    '/rooms/:roomId/timers/:timerId',
    async (request, reply) => {
      const { roomId, timerId } = request.params
      const timer = roomManager.getTimer(roomId, timerId)

      if (!timer) {
        return reply.status(404).send({ error: 'Timer not found' })
      }

      return timer
    }
  )

  // Get server stats (for monitoring)
  fastify.get('/stats', async () => {
    return {
      activeRooms: roomManager.getRoomCount(),
      uptime: process.uptime()
    }
  })
}
