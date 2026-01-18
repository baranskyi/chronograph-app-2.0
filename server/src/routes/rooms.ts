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

    return {
      roomId: room.roomId,
      hasController: !!room.controllerSocketId,
      hasTimerState: !!room.timerState
    }
  })

  // Get server stats (for monitoring)
  fastify.get('/stats', async () => {
    return {
      activeRooms: roomManager.getRoomCount(),
      uptime: process.uptime()
    }
  })
}
