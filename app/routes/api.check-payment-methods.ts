import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import prisma from "../db.server";
import { getShopFromRequest } from "./utils/shop-session";

export const loader: LoaderFunction = async ({ request }) => {
    const shop = await getShopFromRequest(request);

    const status = await prisma.paymentMethods.findUnique({
        where: { shop },
    });

    let parsedMethods = null;

    if (status?.paymentMethod) {
        try {
            parsedMethods = JSON.parse(status.paymentMethod); // safely parse JSON
        } catch (err) {
            console.error("Invalid paymentMethod JSON:", err);
        }
    }

    return json({
        isActive: status?.isActive ?? false,
        methods: parsedMethods,
    });
};