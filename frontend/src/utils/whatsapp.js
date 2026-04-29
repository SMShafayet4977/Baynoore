const WHATSAPP_NUMBER = "8801794529766";

export function whatsappProductLink(productCode) {
  const msg = encodeURIComponent(
    `Hello Baynoore, I need help with this product: ${productCode}`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

export function whatsappOrderLink(orderNumber) {
  const msg = encodeURIComponent(
    `Hello Baynoore, I placed an order. My order number is ${orderNumber}.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

export function whatsappSupportLink() {
  const msg = encodeURIComponent("Hello Baynoore, I need help.");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

export const WHATSAPP_DISPLAY = "+8801794529766";
