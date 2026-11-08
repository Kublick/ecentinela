"use server";

import { validateContact, type ContactState } from "@/lib/contact";

/** Validates the contact form on the server; `ContactForm` delivers it on success. */
export async function submitContact(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  return validateContact(formData);
}
