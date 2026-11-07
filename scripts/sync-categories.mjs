// Creates or updates the 23 e-centinela.com categories as smart collections in
// the Shopify store, from `lib/categories.json`. Each collection keeps the live
// site's handle and matches products that have ANY of the category's tags.
// New collections are published only to the Hydrogen storefront channel
// (CHANNEL below), which is what the Storefront API reads.
//
// Dry run (prints what would change):
//   SHOPIFY_ADMIN_TOKEN=shpat_... node scripts/sync-categories.mjs
// Apply:
//   SHOPIFY_ADMIN_TOKEN=shpat_... node scripts/sync-categories.mjs --apply
//
// The token needs the write_products and write_publications scopes. The store
// comes from NEXT_PUBLIC_STORE_DOMAIN (in `.env`, loaded with --env-file) or
// SHOPIFY_STORE_DOMAIN.

import categories from "../lib/categories.json" with { type: "json" };

const API_VERSION = "2026-10";
const CHANNEL = "hydro-test";
const apply = process.argv.includes("--apply");
const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_TOKEN;

if (!domain?.endsWith(".myshopify.com") || !token) {
  console.error(
    "Set SHOPIFY_ADMIN_TOKEN and a *.myshopify.com SHOPIFY_STORE_DOMAIN (or NEXT_PUBLIC_STORE_DOMAIN).",
  );
  process.exit(1);
}

async function admin(query, variables) {
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`Admin API ${res.status}: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data;
}

function userErrors(result) {
  if (result.userErrors.length > 0) throw new Error(JSON.stringify(result.userErrors));
  return result;
}

const { publications } = await admin(`{ publications(first: 50) { nodes { id name } } }`);
const channel = publications.nodes.find((p) => p.name === CHANNEL);
if (!channel) {
  console.error(`No "${CHANNEL}" channel. Found: ${publications.nodes.map((p) => p.name).join(", ")}`);
  process.exit(1);
}
console.log(`Store ${domain}, publishing new collections to: ${channel.name}`);

for (const category of categories) {
  const ruleSet = {
    appliedDisjunctively: true,
    rules: category.tags.map((tag) => ({ column: "TAG", relation: "EQUALS", condition: tag })),
  };
  const { collectionByIdentifier: existing } = await admin(
    `query ($handle: String!) { collectionByIdentifier(identifier: { handle: $handle }) { id title } }`,
    { handle: category.handle },
  );
  const action = existing ? "update" : "create";
  console.log(`${action} ${category.handle} (${category.tags.length} tags)`);
  if (!apply) continue;

  if (existing) {
    userErrors(
      (
        await admin(
          `mutation ($input: CollectionInput!) { collectionUpdate(input: $input) { userErrors { field message } } }`,
          { input: { id: existing.id, title: category.title, ruleSet } },
        )
      ).collectionUpdate,
    );
    continue;
  }

  const created = userErrors(
    (
      await admin(
        `mutation ($input: CollectionInput!) { collectionCreate(input: $input) { collection { id } userErrors { field message } } }`,
        { input: { title: category.title, handle: category.handle, ruleSet } },
      )
    ).collectionCreate,
  );
  userErrors(
    (
      await admin(
        `mutation ($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { userErrors { field message } } }`,
        {
          id: created.collection.id,
          input: [{ publicationId: channel.id }],
        },
      )
    ).publishablePublish,
  );
}

if (!apply) console.log("\nDry run. Re-run with --apply to write to the store.");
