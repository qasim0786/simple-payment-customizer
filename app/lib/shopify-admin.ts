import { authenticate } from "../shopify.server";

export async function graphqlRequest(
    admin: { shop: string; accessToken: string },
    query: string,
    variables = {}
) {
    const response = await fetch(`https://${admin.shop}/admin/api/2024-01/graphql.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": admin.accessToken,
        },
        body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();

    if (!response.ok || json.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(json.errors || json)}`);
    }

    return json.data;
} 