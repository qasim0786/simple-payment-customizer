import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { graphqlRequest } from "../lib/shopify-admin";

export const action: ActionFunction = async ({ request }) => {
    try {
        const { session } = await authenticate.admin(request);
        const shop = session.shop;
        const accessToken = session.accessToken;

        if (!accessToken) {
            return json({ success: false, message: "Missing access token" }, { status: 401 });
        }

        const body = await request.json();
        const paymentMethods = body.paymentMethods;

        if (!Array.isArray(paymentMethods)) {
            return json({ success: false, message: "Invalid payment methods format" }, { status: 400 });
        }

        for (const method of paymentMethods) {
            if (typeof method.name !== "string" || typeof method.priority !== "number") {
                return json({ success: false, message: "Invalid method format" }, { status: 400 });
            }
        }

        // Save locally in the database
        const payload = {
            shop,
            paymentMethod: JSON.stringify(paymentMethods),
        };

        await prisma.paymentMethods.upsert({
            where: { shop },
            update: payload,
            create: { ...payload, isActive: true },
        });

        // Fetch shop ID and check existing metafield
        const shopQuery = `
      query {
        shop {
          id
          metafield(namespace: "paymentCustomization", key: "payment-added-value") {
            id
          }
        }
      }
    `;

        const shopInfo = await graphqlRequest({ shop, accessToken }, shopQuery);
        const shopId = shopInfo.shop.id;
        const existingMetafieldId = shopInfo.shop.metafield?.id;

        // Use only metafieldsSet (valid for both create & update)
        const mutation = `
      mutation SetMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
            namespace
            value
            type
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

        const variables = {
            metafields: [
                {

                    namespace: "paymentCustomization",
                    key: "payment-added-value",
                    type: "json",
                    value: JSON.stringify(paymentMethods),
                    ownerId: shopId,
                },
            ],
        };

        const result = await graphqlRequest({ shop, accessToken }, mutation, variables);
        const errors = result?.metafieldsSet?.userErrors;

        if (errors?.length) {
            return json({ success: false, message: errors[0].message }, { status: 500 });
        }

        return json({ success: true });
    } catch (error: any) {
        console.error("Save payment methods error:", error);
        return json({ success: false, message: error.message || "Unknown error" }, { status: 500 });
    }
};
