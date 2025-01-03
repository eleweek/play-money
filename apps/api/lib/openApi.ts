import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi, RouteConfig } from '@asteasolutions/zod-to-openapi'
import { glob } from 'glob'
import * as fs from 'node:fs'
import path from 'node:path'
import { OpenAPI } from 'openapi-types'
import { z, ZodType } from 'zod'
import { ApiEndpoints } from '@play-money/api-helpers'

extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()

function getResponseDescription(status: number): string {
  const descriptions: Record<number, string> = {
    200: 'Successful response',
    201: 'Resource created successfully',
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Resource not found',
    500: 'Internal server error',
  }
  return descriptions[status] || 'Response'
}

async function getDocument() {
  const apiFolder = 'app/api'
  const schemaFiles = glob.sync(path.join(apiFolder, '**/schema.ts'))

  await Promise.all(
    schemaFiles.map(async (file) => {
      const route = path.relative(apiFolder, path.dirname(file))
      const schemaModule = (await import(`../app/api/${route}/schema.ts`)) as { default: ApiEndpoints }
      const endpoints = schemaModule.default
      const pathname = `/${route}`

      for (const [method, endpoint] of Object.entries(endpoints)) {
        const responses: RouteConfig['responses'] = {}

        for (const [status, responseSchema] of Object.entries(endpoint.responses)) {
          responses[status] = {
            description: getResponseDescription(parseInt(status, 10)),
            content: {
              'application/json': {
                schema: responseSchema as ZodType,
              },
            },
          }
        }

        const params: Record<string, z.ZodTypeAny> = {}

        if (endpoint.parameters) {
          const paramsSchema =
            endpoint.parameters instanceof z.ZodOptional ? endpoint.parameters.unwrap() : endpoint.parameters

          const shapeEntries = Object.entries(paramsSchema.shape as Record<string, z.ZodTypeAny>)

          for (const [key, paramType] of shapeEntries) {
            const registeredParam = registry.registerParameter(
              key,
              paramType.openapi({
                param: {
                  name: key,
                  in: 'path',
                },
              })
            )

            params[key] = registeredParam
          }
        }

        registry.registerPath({
          method: method as RouteConfig['method'],
          path: pathname,
          request: {
            body: endpoint.requestBody
              ? {
                  content: {
                    'application/json': {
                      schema: endpoint.requestBody,
                    },
                  },
                }
              : undefined,
            params: Object.keys(params).length !== 0 ? z.object(params) : undefined,
          },
          responses,
        })
      }
    })
  )

  const generator = new OpenApiGeneratorV31(registry.definitions)
  const document = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'PlayMoney API',
      version: '1.0',
    },
    servers: process.env.NEXT_PUBLIC_API_URL
      ? [
          {
            url: process.env.NEXT_PUBLIC_API_URL,
            description: 'API Server',
          },
        ]
      : undefined,
  })

  return JSON.parse(JSON.stringify(document)) as OpenAPI.Document
}

async function writeDocument() {
  const docs = await getDocument()

  fs.writeFileSync(`${__dirname}/../openapi.json`, JSON.stringify(docs, null, 2), {
    encoding: 'utf-8',
  })
}

void writeDocument()
