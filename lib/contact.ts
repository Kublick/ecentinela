/**
 * Contact form validation and delivery, shared by the server action
 * (`app/[lang]/pages/contact/actions.ts`) and the form (`ContactForm`).
 *
 * shortcut: delivery is a `mailto:` link to the store inbox, filled with the
 * validated message (the store is password-protected, so Shopify's own
 * `/contact` form can't take it, and no email provider is configured yet).
 * Upgrade to a server-side send (Resend, SMTP) once the store has a provider.
 */
export const CONTACT_EMAIL = "gerenci.centinela@gmail.com";

export const CONTACT_FIELDS = ["name", "orderNumber", "email", "phone", "message"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];
export type ContactValues = Record<ContactField, string>;
export type ContactError = "required" | "email" | "phone" | "tooLong";

export type ContactState =
  | { status: "idle" }
  | { status: "error"; values: ContactValues; errors: Partial<Record<ContactField, ContactError>> }
  | { status: "success"; values: ContactValues };

const MAX_LENGTH: Record<ContactField, number> = {
  name: 100,
  orderNumber: 40,
  email: 254,
  phone: 30,
  message: 2000,
};
const OPTIONAL: ReadonlySet<ContactField> = new Set(["orderNumber"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s().-]+$/;

export function validateContact(formData: FormData): Exclude<ContactState, { status: "idle" }> {
  const read = (field: ContactField) => {
    const value = formData.get(field);
    return typeof value === "string" ? value.trim() : "";
  };
  const values: ContactValues = {
    name: read("name"),
    orderNumber: read("orderNumber"),
    email: read("email"),
    phone: read("phone"),
    message: read("message"),
  };

  const errors: Partial<Record<ContactField, ContactError>> = {};
  for (const field of CONTACT_FIELDS) {
    const error = fieldError(field, values[field]);
    if (error) errors[field] = error;
  }

  return Object.keys(errors).length > 0
    ? { status: "error", values, errors }
    : { status: "success", values };
}

function fieldError(field: ContactField, value: string): ContactError | undefined {
  if (!value) return OPTIONAL.has(field) ? undefined : "required";
  if (value.length > MAX_LENGTH[field]) return "tooLong";
  if (field === "email" && !EMAIL.test(value)) return "email";
  if (field === "phone" && (!PHONE.test(value) || value.replace(/\D/g, "").length < 7))
    return "phone";
  return undefined;
}

/** `mailto:` URL that sends the message to the store inbox. */
export function contactMailto(
  values: ContactValues,
  labels: Record<ContactField, string>,
  subject: string,
): string {
  const body = CONTACT_FIELDS.filter((field) => field !== "message" && values[field])
    .map((field) => `${labels[field]}: ${values[field]}`)
    .concat("", values.message)
    .join("\n");
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
