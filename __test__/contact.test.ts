import assert from "node:assert/strict";
import test from "node:test";

import { contactMailto, validateContact } from "../lib/contact.ts";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const valid = {
  name: " Ana López ",
  orderNumber: "",
  email: "ana@example.com",
  phone: "+52 (686) 592-9294",
  message: "¿Tienen el relevador 40.52?",
};

test("accepts a complete message and trims values", () => {
  const result = validateContact(form(valid));
  assert.equal(result.status, "success");
  assert.equal(result.values.name, "Ana López");
});

test("flags missing, malformed and oversized fields", () => {
  const result = validateContact(
    form({ name: "", email: "ana@", phone: "12ab", message: "x".repeat(2001) }),
  );
  assert.equal(result.status, "error");
  assert.deepEqual(result.status === "error" && result.errors, {
    name: "required",
    email: "email",
    phone: "phone",
    message: "tooLong",
  });
});

test("rejects a phone with too few digits", () => {
  const result = validateContact(form({ ...valid, phone: "123-45" }));
  assert.equal(result.status === "error" && result.errors.phone, "phone");
});

test("builds an encoded mailto without the empty order number", () => {
  const result = validateContact(form(valid));
  const labels = {
    name: "Nombre",
    orderNumber: "Orden",
    email: "Email",
    phone: "Tel",
    message: "Msg",
  };
  const url = contactMailto(result.values, labels, "Contacto: Ana");
  assert.ok(url.startsWith("mailto:gerenci.centinela@gmail.com?subject=Contacto%3A%20Ana&body="));
  const body = decodeURIComponent(url.split("body=")[1]);
  assert.equal(
    body,
    "Nombre: Ana López\nEmail: ana@example.com\nTel: +52 (686) 592-9294\n\n¿Tienen el relevador 40.52?",
  );
});
