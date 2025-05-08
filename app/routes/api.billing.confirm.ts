import { LoaderFunction, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * This route handles the redirect from Shopify after a merchant accepts the subscription plan.
 * Shopify will automatically redirect to the `returnUrl` you passed in `appSubscriptionCreate`.
 * This handler revalidates the session and redirects the merchant to your app dashboard.
 */
export const loader: LoaderFunction = async ({ request }) => {
    const { session } = await authenticate.admin(request);

    // You can log this if needed or store flags like `billingAccepted` in DB here.
    console.log(`Billing accepted for shop: ${session.shop}`);

    // Optional: you could store a billing flag in your DB if you want
    // await prisma.shop.update({ where: { shop: session.shop }, data: { billingActive: true } });

    // Redirect to the app dashboard or home page
    return redirect("/app");
};
