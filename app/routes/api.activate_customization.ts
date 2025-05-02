import { json } from "@remix-run/node";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import prisma from "../db.server";
import { getShopFromRequest } from "./utils/shop-session";
import { authenticate } from "../shopify.server";
import { graphqlRequest } from "./utils/graphql";


const TARGET_FUNCTION_TITLE = "Simple-Payment-Customizer";


export const loader: LoaderFunction = async ({ request }) => {
  console.log("---------------------->loader------------------------>");
  const shop = await getShopFromRequest(request);

  const status = await prisma.paymentCustomizationStatus.findUnique({
    where: { shop },
  });

  return json({ isActive: status?.isActive ?? false });
};

export const action: ActionFunction = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const accessToken = session.accessToken;
  if (!accessToken) {
    throw new Error("Missing access token.");
  }

  const query = `#graphql
  query {
    shopifyFunctions(first: 25) {
      nodes {
        app {
          title
        }
        apiType
        title
        id
      }
    }
  }
`;

  const response = await admin.graphql(query);
  const result = await response.json();
  console.log(result.data.shopifyFunctions.nodes);

  const normalizeTitle = (title: string) =>
    title.toLowerCase().replace(/[-_ ]/g, "");


  const targetFunction = result.data?.shopifyFunctions.nodes.find(
    (fn: any) => normalizeTitle(fn.app?.title) === normalizeTitle(TARGET_FUNCTION_TITLE)
  );

  if (!targetFunction) {
    return json({ success: false, error: "Target function not found.", message: result.data.shopifyFunctions.nodes }, { status: 404 });
  }

  const functionId = targetFunction.id;
  if (!functionId) {
    return json({ success: false, error: "function id not found." }, { status: 404 });
  }

  // Step 2: Create Payment Customization with metafield
  const mutation = `#graphql
    mutation CreateCustomization($functionId: String!, $title: String!) {
      paymentCustomizationCreate(
        paymentCustomization: {
          title: $title,
          enabled: true,
          functionId: $functionId
        }
      ) {
        paymentCustomization {
          id
        }
        userErrors {
          message
        }
      }
    }
  `;

  const mutationResponse = await admin.graphql(mutation, {
    variables: {
      functionId: functionId,
      title: "simple-payment-customizer",
    },
  });
  const mutationData = await mutationResponse.json();

  const userErrors = mutationData.data?.paymentCustomizationCreate?.userErrors ?? [];

  if (userErrors.length > 0) {
    return json({ success: false, error: userErrors[0].message }, { status: 400 });
  }

  // Step 3: Mark DB as active
  const existing = await prisma.paymentCustomizationStatus.findUnique({ where: { shop } });

  if (existing) {
    await prisma.paymentCustomizationStatus.update({
      where: { shop },
      data: { isActive: true },
    });
  } else {
    await prisma.paymentCustomizationStatus.create({
      data: { shop, isActive: true },
    });
  }

  return json({ success: true });
};