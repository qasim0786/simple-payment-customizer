// app/subscription.server.ts
import { authenticate } from "./shopify.server";

const PLAN_NAME = "Fena Pro Plan";
const PLAN_PRICE = 4.99;
const RETURN_URL = "https://simple-payment-customizer.onrender.com/api/billing/confirm"; // Change to your app's domain

export async function ensureBilling(request: Request) {
    const { session, admin } = await authenticate.admin(request);
    const shop = session.shop;

    // Check if subscription is already active
    const existing = await admin.graphql(`
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
        }
      }
    }
  `);

    const result = await existing.json();
    const activeSubscriptions = result?.data?.currentAppInstallation?.activeSubscriptions || [];

    const alreadySubscribed = activeSubscriptions.some(
        (sub: any) => sub.status === "ACTIVE" && sub.name === PLAN_NAME
    );

    if (alreadySubscribed) {
        return { subscribed: true };
    }

    // Create subscription with 3-day free trial
    const mutation = `
    mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!) {
      appSubscriptionCreate(
        name: $name,
        returnUrl: $returnUrl,
        lineItems: $lineItems,
        test: true
      ) {
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }
  `;

    const response = await admin.graphql(mutation, {
        variables: {
            name: PLAN_NAME,
            returnUrl: RETURN_URL,
            lineItems: [
                {
                    plan: {
                        appRecurringPricingDetails: {
                            price: {
                                amount: PLAN_PRICE,
                                currencyCode: "USD",
                            },
                            interval: "EVERY_30_DAYS",
                            trialDays: 3
                        },
                    },
                },
            ],
        },
    });

    const json = await response.json();
    const confirmationUrl = json.data?.appSubscriptionCreate?.confirmationUrl;

    if (!confirmationUrl) {
        const errors = json.data?.appSubscriptionCreate?.userErrors || [];
        throw new Error("Failed to create billing plan: " + JSON.stringify(errors));
    }

    return { subscribed: false, confirmationUrl };
}
