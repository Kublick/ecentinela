// Copies product datasheet PDFs from the old e-centinela.com store into this
// store's Files and links each one to its product through the
// `custom.datasheet` metafield, which the storefront shows as "Ficha técnica".
//
// The old theme never stored the link: it built it from the product handle,
// `https://cdn.shopify.com/s/files/1/1832/1335/files/{handle}.pdf`. This script
// checks that address for every product here, so only real PDFs are copied.
// Products that already have a datasheet are skipped, so it is safe to re-run.
//
// Dry run (prints what would change):
//   SHOPIFY_ADMIN_TOKEN=shpat_... node --env-file=.env scripts/sync-datasheets.mjs
// Apply:
//   SHOPIFY_ADMIN_TOKEN=shpat_... node --env-file=.env scripts/sync-datasheets.mjs --apply
//
// The token needs the read_products, write_products and write_files scopes.

const API_VERSION = "2026-10";
const OLD_FILES = "https://cdn.shopify.com/s/files/1/1832/1335/files";
const BATCH = 25;
const apply = process.argv.includes("--apply");
const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_TOKEN;

if (!domain?.endsWith(".myshopify.com") || !token) {
  console.error(
    "Set SHOPIFY_ADMIN_TOKEN and a *.myshopify.com SHOPIFY_STORE_DOMAIN (or NEXT_PUBLIC_STORE_DOMAIN).",
  );
  process.exit(1);
}

async function admin(query, variables, attempt = 1) {
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  // `errors` is an array for GraphQL errors but a plain string for auth failures.
  const throttled =
    Array.isArray(json.errors) && json.errors.some((error) => error.extensions?.code === "THROTTLED");
  if ((res.status === 429 || throttled) && attempt < 6) {
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    return admin(query, variables, attempt + 1);
  }
  if (!res.ok || json.errors) {
    throw new Error(`Admin API ${res.status}: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data;
}

function userErrors(result) {
  if (result.userErrors.length > 0) throw new Error(JSON.stringify(result.userErrors));
  return result;
}

/** Runs `task` over `items` with at most `limit` in flight. */
async function mapLimit(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function hasOldPdf(handle) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${OLD_FILES}/${handle}.pdf`, { method: "HEAD" });
      return res.ok && (res.headers.get("content-type") ?? "").includes("pdf");
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
}

// 0. Fail early, before any work, if the token can't do what --apply needs.
const { currentAppInstallation } = await admin(`{ currentAppInstallation { accessScopes { handle } } }`);
const scopes = currentAppInstallation.accessScopes.map((scope) => scope.handle);
console.log(`Token scopes: ${scopes.join(", ")}`);
const needed = ["write_products", "write_files"].filter((scope) => !scopes.includes(scope));
if (apply && needed.length > 0) {
  console.error(
    `Missing scopes: ${needed.join(", ")}. Add them to the app, release/reinstall it, and use a new token.`,
  );
  process.exit(1);
}

// 1. The metafield must be a file reference the storefront can read.
const { metafieldDefinitions } = await admin(`{
  metafieldDefinitions(first: 1, ownerType: PRODUCT, namespace: "custom", key: "datasheet") {
    nodes { id type { name } access { storefront } }
  }
}`);
const definition = metafieldDefinitions.nodes[0];
if (definition && definition.type.name !== "file_reference") {
  console.error(`custom.datasheet exists as "${definition.type.name}"; expected file_reference.`);
  process.exit(1);
}
console.log(
  definition
    ? `custom.datasheet definition exists (storefront: ${definition.access.storefront})`
    : "create custom.datasheet definition (file_reference, readable by the storefront)",
);

// 2. Every product here, with its current datasheet.
const products = [];
for (let after = null; ; ) {
  const { products: page } = await admin(
    `query ($after: String) {
      products(first: 250, after: $after) {
        nodes { id handle datasheet: metafield(namespace: "custom", key: "datasheet") { id } }
        pageInfo { hasNextPage endCursor }
      }
    }`,
    { after },
  );
  products.push(...page.nodes);
  if (!page.pageInfo.hasNextPage) break;
  after = page.pageInfo.endCursor;
}
const missing = products.filter((product) => !product.datasheet);
console.log(`Store ${domain}: ${products.length} products, ${missing.length} without a datasheet`);

// 3. Which of those have a PDF on the old store.
const found = await mapLimit(missing, 16, async (product) =>
  (await hasOldPdf(product.handle)) ? product : null,
);
const toLink = found.filter(Boolean);
console.log(`${toLink.length} have a PDF on the old store to copy and link`);
if (!apply) {
  console.log(toLink.slice(0, 10).map((product) => `  ${product.handle}`).join("\n"));
  console.log("Dry run. Re-run with --apply to copy the files and link them.");
  process.exit(0);
}

if (!definition) {
  userErrors(
    (
      await admin(
        `mutation ($definition: MetafieldDefinitionInput!) {
          metafieldDefinitionCreate(definition: $definition) { userErrors { field message } }
        }`,
        {
          definition: {
            name: "Ficha técnica",
            namespace: "custom",
            key: "datasheet",
            type: "file_reference",
            ownerType: "PRODUCT",
            access: { storefront: "PUBLIC_READ" },
            validations: [{ name: "file_type_options", value: '["GenericFile"]' }],
          },
        },
      )
    ).metafieldDefinitionCreate,
  );
}

// 4. Copy the files, then point each product at its copy.
let linked = 0;
for (let start = 0; start < toLink.length; start += BATCH) {
  const batch = toLink.slice(start, start + BATCH);
  const { fileCreate } = await admin(
    `mutation ($files: [FileCreateInput!]!) {
      fileCreate(files: $files) { files { id } userErrors { field message } }
    }`,
    {
      files: batch.map((product) => ({
        originalSource: `${OLD_FILES}/${product.handle}.pdf`,
        contentType: "FILE",
        filename: `${product.handle}.pdf`,
      })),
    },
  );
  userErrors(fileCreate);

  const { metafieldsSet } = await admin(
    `mutation ($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { userErrors { field message } }
    }`,
    {
      metafields: batch.map((product, index) => ({
        ownerId: product.id,
        namespace: "custom",
        key: "datasheet",
        type: "file_reference",
        value: fileCreate.files[index].id,
      })),
    },
  );
  userErrors(metafieldsSet);
  linked += batch.length;
  console.log(`linked ${linked}/${toLink.length}`);
}
console.log("Done. Shopify finishes processing the files in the background.");
