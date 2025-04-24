import { authenticate } from "../../shopify.server"; // path to your main shopify file

export async function getShopFromRequest(request: Request): Promise<string> {
    const { session } = await authenticate.admin(request);
    return session.shop;
}
