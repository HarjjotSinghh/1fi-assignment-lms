export const openApiSpec = {
    openapi: "3.0.0",
    info: {
        title: "1fi LMS API",
        version: "1.0.0",
        description: "API documentation for the 1fi Learning Management System (Lending Management System)",
        contact: {
            name: "API Support",
            email: "support@1fi.com"
        }
    },
    servers: [
        {
            url: "/api",
            description: "Current environment"
        }
    ],
    components: {
        securitySchemes: {
            ApiKeyAuth: {
                type: "apiKey",
                in: "header",
                name: "x-api-key"
            }
        },
        schemas: {
            Error: {
                type: "object",
                properties: {
                    error: {
                        type: "string"
                    },
                    message: {
                        type: "string"
                    }
                }
            },
            ApiKey: {
                type: "object",
                properties: {
                    id: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    },
                    prefix: {
                        type: "string"
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time"
                    }
                }
            }
        }
    },
    security: [
        {
            ApiKeyAuth: []
        }
    ],
    paths: {
        "/api-keys": {
            get: {
                summary: "List API Keys",
                tags: ["Configuration"],
                responses: {
                    "200": {
                        description: "List of API keys",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/ApiKey"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: "Create API Key",
                tags: ["Configuration"],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: {
                                        type: "string"
                                    },
                                    description: {
                                        type: "string"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": {
                        description: "API Key created",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        key: {
                                            type: "string",
                                            description: "The full API key (only shown once)"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/loans": {
            get: {
                summary: "List Loans",
                tags: ["Lending"],
                parameters: [
                    {
                        name: "status",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: ["ACTIVE", "CLOSED", "PENDING"]
                        }
                    },
                    {
                        name: "page",
                        in: "query",
                        schema: {
                            type: "integer",
                            default: 1
                        }
                    }
                ],
                responses: {
                    "200": {
                        description: "List of loans",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    amount: { type: "number" },
                                                    status: { type: "string" }
                                                }
                                            }
                                        },
                                        meta: {
                                            type: "object",
                                            properties: {
                                                total: { type: "integer" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/customers/{id}": {
            get: {
                summary: "Get Customer Details",
                tags: ["Customers"],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string"
                        }
                    }
                ],
                responses: {
                    "200": {
                        description: "Customer details",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        name: { type: "string" },
                                        email: { type: "string" },
                                        phone: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        description: "Customer not found"
                    }
                }
            }
        }
    }
};
