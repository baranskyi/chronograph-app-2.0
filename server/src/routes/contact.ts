import { FastifyInstance } from 'fastify'
import nodemailer from 'nodemailer'
import { config } from '../config.js'

export async function contactRoutes(fastify: FastifyInstance) {
  fastify.post('/contact', async (request, reply) => {
    const { name, email, company, message } = request.body as {
      name: string
      email: string
      company?: string
      message: string
    }

    if (!name || !email || !message) {
      return reply.status(400).send({ error: 'Name, email, and message are required' })
    }

    try {
      // Send email if SMTP is configured
      if (config.email.smtpUser && config.email.smtpPass) {
        const transporter = nodemailer.createTransport({
          host: config.email.smtpHost,
          port: config.email.smtpPort,
          secure: config.email.smtpPort === 465,
          auth: {
            user: config.email.smtpUser,
            pass: config.email.smtpPass
          }
        })

        await transporter.sendMail({
          from: `"Chronograph Contact" <${config.email.smtpUser}>`,
          to: config.email.contactTo,
          replyTo: email,
          subject: `[Chronograph] Enterprise inquiry from ${name}`,
          html: `
            <h2>New Enterprise Contact Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company || 'Not specified'}</p>
            <hr/>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br/>')}</p>
          `
        })
      }

      return reply.send({ success: true })
    } catch (error) {
      fastify.log.error(error, 'Failed to send contact email')
      return reply.status(500).send({ error: 'Failed to send message' })
    }
  })
}
