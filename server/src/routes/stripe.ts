import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import Stripe from 'stripe'
import { config } from '../config.js'
import { getServiceSupabase } from '../services/supabase.js'

// Initialize Stripe (will be null if no secret key)
const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey)
  : null

// Price ID mapping
const PRICE_IDS: Record<string, string> = {
  'basic-monthly': config.stripe.prices.basicMonthly,
  'basic-yearly': config.stripe.prices.basicYearly,
  'unlimited-monthly': config.stripe.prices.unlimitedMonthly,
  'unlimited-yearly': config.stripe.prices.unlimitedYearly
}

// Plan mapping from price to plan name
const PLAN_FROM_PRICE: Record<string, string> = {
  [config.stripe.prices.basicMonthly]: 'basic',
  [config.stripe.prices.basicYearly]: 'basic',
  [config.stripe.prices.unlimitedMonthly]: 'unlimited',
  [config.stripe.prices.unlimitedYearly]: 'unlimited'
}

interface CreateCheckoutBody {
  userId: string
  email: string
  plan: 'basic' | 'unlimited'
  billing: 'monthly' | 'yearly'
}

interface WebhookBody {
  type: string
  data: {
    object: Stripe.Checkout.Session | Stripe.Subscription | Stripe.Invoice
  }
}

export async function stripeRoutes(fastify: FastifyInstance) {
  // Check if Stripe is configured
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip check for webhook endpoint (it has its own validation)
    if (request.url === '/api/stripe/webhook') return

    if (!stripe) {
      return reply.status(503).send({
        error: 'Stripe is not configured',
        message: 'Payment processing is not available at this time'
      })
    }
  })

  // Create Checkout Session
  fastify.post<{ Body: CreateCheckoutBody }>(
    '/checkout',
    async (request: FastifyRequest<{ Body: CreateCheckoutBody }>, reply: FastifyReply) => {
      const { userId, email, plan, billing } = request.body

      if (!userId || !email || !plan || !billing) {
        return reply.status(400).send({ error: 'Missing required fields' })
      }

      const priceKey = `${plan}-${billing}`
      const priceId = PRICE_IDS[priceKey]

      if (!priceId) {
        return reply.status(400).send({ error: 'Invalid plan or billing period' })
      }

      try {
        // Check if customer already exists
        const supabase = getServiceSupabase()
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('stripe_customer_id')
          .eq('user_id', userId)
          .single()

        let customerId = subscription?.stripe_customer_id

        // Create new customer if needed
        if (!customerId && stripe) {
          const customer = await stripe.customers.create({
            email,
            metadata: { userId }
          })
          customerId = customer.id

          // Save customer ID
          await supabase
            .from('user_subscriptions')
            .update({ stripe_customer_id: customerId })
            .eq('user_id', userId)
        }

        // Create checkout session
        const session = await stripe!.checkout.sessions.create({
          customer: customerId || undefined,
          customer_email: customerId ? undefined : email,
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: priceId,
              quantity: 1
            }
          ],
          success_url: `${config.appUrl}/my-rooms?checkout=success`,
          cancel_url: `${config.appUrl}/#pricing`,
          metadata: {
            userId,
            plan
          },
          subscription_data: {
            metadata: {
              userId,
              plan
            }
          }
        })

        return { url: session.url, sessionId: session.id }
      } catch (error) {
        console.error('Stripe checkout error:', error)
        return reply.status(500).send({ error: 'Failed to create checkout session' })
      }
    }
  )

  // Create Customer Portal Session
  fastify.post<{ Body: { userId: string } }>(
    '/portal',
    async (request: FastifyRequest<{ Body: { userId: string } }>, reply: FastifyReply) => {
      const { userId } = request.body

      if (!userId) {
        return reply.status(400).send({ error: 'Missing userId' })
      }

      try {
        const supabase = getServiceSupabase()
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('stripe_customer_id')
          .eq('user_id', userId)
          .single()

        if (!subscription?.stripe_customer_id) {
          return reply.status(400).send({ error: 'No Stripe customer found' })
        }

        const session = await stripe!.billingPortal.sessions.create({
          customer: subscription.stripe_customer_id,
          return_url: `${config.appUrl}/profile`
        })

        return { url: session.url }
      } catch (error) {
        console.error('Stripe portal error:', error)
        return reply.status(500).send({ error: 'Failed to create portal session' })
      }
    }
  )

  // Webhook handler
  fastify.post(
    '/webhook',
    {
      config: {
        rawBody: true
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!stripe) {
        return reply.status(503).send({ error: 'Stripe not configured' })
      }

      const sig = request.headers['stripe-signature'] as string
      const rawBody = (request as any).rawBody || request.body

      let event: Stripe.Event

      try {
        if (config.stripe.webhookSecret) {
          event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            config.stripe.webhookSecret
          )
        } else {
          // Development mode - trust the payload
          event = request.body as Stripe.Event
        }
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return reply.status(400).send({ error: 'Invalid signature' })
      }

      const supabase = getServiceSupabase()

      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session
            const userId = session.metadata?.userId
            const plan = session.metadata?.plan as 'basic' | 'unlimited'

            if (userId && plan) {
              await supabase
                .from('user_subscriptions')
                .update({
                  plan,
                  status: 'active',
                  stripe_customer_id: session.customer as string,
                  stripe_subscription_id: session.subscription as string,
                  trial_ends_at: null
                })
                .eq('user_id', userId)

              console.log(`Subscription activated for user ${userId}: ${plan}`)
            }
            break
          }

          case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription
            const userId = subscription.metadata?.userId

            if (userId) {
              const priceId = subscription.items.data[0]?.price.id
              const plan = PLAN_FROM_PRICE[priceId] || 'basic'

              await supabase
                .from('user_subscriptions')
                .update({
                  plan,
                  status: subscription.status === 'active' ? 'active' : subscription.status,
                  current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  cancel_at_period_end: subscription.cancel_at_period_end
                })
                .eq('user_id', userId)

              console.log(`Subscription updated for user ${userId}: ${subscription.status}`)
            }
            break
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription
            const userId = subscription.metadata?.userId

            if (userId) {
              await supabase
                .from('user_subscriptions')
                .update({
                  status: 'canceled',
                  stripe_subscription_id: null
                })
                .eq('user_id', userId)

              console.log(`Subscription canceled for user ${userId}`)
            }
            break
          }

          case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice
            const customerId = invoice.customer as string

            // Find user by customer ID
            const { data: sub } = await supabase
              .from('user_subscriptions')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .single()

            if (sub?.user_id) {
              await supabase
                .from('user_subscriptions')
                .update({ status: 'past_due' })
                .eq('user_id', sub.user_id)

              console.log(`Payment failed for user ${sub.user_id}`)
            }
            break
          }

          default:
            console.log(`Unhandled event type: ${event.type}`)
        }

        return { received: true }
      } catch (error) {
        console.error('Webhook processing error:', error)
        return reply.status(500).send({ error: 'Webhook processing failed' })
      }
    }
  )
}
