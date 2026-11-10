"use client";

import { useActionState, type ReactNode } from "react";

import { submitContact } from "@/app/[lang]/pages/contact/actions";
import { useI18n } from "@/components/I18nProvider";
import { CONTACT_EMAIL, contactMailto, type ContactField, type ContactState } from "@/lib/contact";
import { interpolate } from "@/lib/content";

const INITIAL_STATE: ContactState = { status: "idle" };

const FIELDS: { name: ContactField; type: string; autoComplete: string }[] = [
  { name: "name", type: "text", autoComplete: "name" },
  { name: "orderNumber", type: "text", autoComplete: "off" },
  { name: "email", type: "email", autoComplete: "email" },
  { name: "phone", type: "tel", autoComplete: "tel" },
];

/**
 * Contact form. The server action validates; on success the shopper sends the
 * validated message from their email app through a prefilled `mailto:` link
 * (see `lib/contact.ts`).
 */
export function ContactForm() {
  const { content } = useI18n();
  const copy = content.contact;
  const [state, formAction, pending] = useActionState(submitContact, INITIAL_STATE);
  const mailto =
    state.status === "success"
      ? contactMailto(
          state.values,
          copy.fields,
          interpolate(copy.subject, { name: state.values.name }),
        )
      : null;

  const errors = state.status === "error" ? state.errors : {};
  const values = state.status === "error" ? state.values : null;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {state.status === "error" ? (
        <p role="alert" className="text-sale font-semibold">
          {copy.errors.summary}
        </p>
      ) : null}
      {state.status === "success" && mailto ? (
        <div role="status" className="bg-tint rounded-lg p-4">
          <p className="text-primary-dark font-bold">{copy.success.heading}</p>
          <p className="mt-1">{interpolate(copy.success.body, { email: CONTACT_EMAIL })}</p>
          <a
            href={mailto}
            className="rounded-button button-primary mt-3 inline-flex h-11 items-center px-5 font-semibold no-underline"
          >
            {copy.success.open}
          </a>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => {
          const error = errors[field.name];
          return (
            <Field
              key={field.name}
              name={field.name}
              label={
                field.name === "orderNumber"
                  ? `${copy.fields.orderNumber} ${copy.optional}`
                  : copy.fields[field.name]
              }
              error={error && copy.errors[error]}
            >
              <input
                id={`contact-${field.name}`}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                required={field.name !== "orderNumber"}
                defaultValue={values?.[field.name]}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `contact-${field.name}-error` : undefined}
                className="min-h-11"
              />
            </Field>
          );
        })}
      </div>
      <Field
        name="message"
        label={copy.fields.message}
        error={errors.message && copy.errors[errors.message]}
      >
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          defaultValue={values?.message}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="rounded-button button-primary inline-flex h-11 items-center justify-center self-start px-6 font-semibold"
      >
        {pending ? copy.sending : copy.submit}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  error,
  children,
}: {
  name: ContactField;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`contact-${name}`} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`contact-${name}-error`} className="text-sale text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
