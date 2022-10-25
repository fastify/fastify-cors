import fastify from 'fastify'
import { fastifyCors } from '..'

const app = fastify()

app.register(fastifyCors)
