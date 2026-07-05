const pageShell = ({ title, body }) => `
  <div style="margin:0;padding:0;width:100%;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;">
    <div style="width:100%;margin:0;padding:0;background:#ffffff;border:0;">
      <div style="background:#111827;color:#ffffff;padding:20px 24px;">
        <h1 style="margin:0;font-size:22px;line-height:1.4;">${title}</h1>
      </div>
      <div style="padding:24px;color:#111827;line-height:1.7;font-size:15px;">
        ${body}
      </div>
      <div style="padding:18px 24px;border-top:1px solid #eef0f4;color:#6b7280;font-size:13px;">
        If you did not request this email, you can safely ignore it.
      </div>
    </div>
  </div>
`;

const formatMoney = (amount, currency = "EUR") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount || 0));

const listItemsHtml = (items = []) => {
  return items
    .map(
      (item) => `
        <li style="margin-bottom:10px;">
          <strong>${item.name}</strong> × ${item.quantity}
          <span style="color:#6b7280;"> - ${formatMoney(item.lineTotal)}</span>
        </li>
      `,
    )
    .join("");
};

export const registrationEmailTemplate = ({ name }) => {
  const html = pageShell({
    title: "Welcome to our store",
    body: `
      <p style="margin:0 0 12px;">Hi <strong>${name || "there"}</strong>,</p>
      <p style="margin:0 0 12px;">Your account has been created successfully.</p>
      <p style="margin:0;">You can now log in, browse products, save items to cart, and place orders.</p>
    `,
  });

  return {
    subject: "Registration successful",
    html,
    text: `Hi ${name || "there"}, your account has been created successfully.`,
  };
};

export const newsletterSignupTemplate = ({ name, email }) => {
  const html = pageShell({
    title: "Newsletter signup confirmed",
    body: `
      <p style="margin:0 0 12px;">Hi <strong>${name || "there"}</strong>,</p>
      <p style="margin:0 0 12px;">${email ? `We added <strong>${email}</strong> to our email list.` : "You are now subscribed to our email list."}</p>
      <p style="margin:0;">We’ll send product updates, offers, and important announcements.</p>
    `,
  });

  return {
    subject: "Newsletter signup successful",
    html,
    text: `${name || "there"}, you are now subscribed to our email list.`,
  };
};

export const orderConfirmationTemplate = ({
  name,
  orderId,
  items = [],
  totalPrice,
  shippingAddress,
}) => {
  const html = pageShell({
    title: "Order confirmation",
    body: `
      <p style="margin:0 0 12px;">Hi <strong>${name || "there"}</strong>, your order was placed successfully.</p>
      <p style="margin:0 0 12px;"><strong>Order ID:</strong> ${orderId}</p>
      <p style="margin:0 0 12px;"><strong>Total:</strong> ${formatMoney(totalPrice)}</p>
      <p style="margin:0 0 12px;"><strong>Shipping to:</strong> ${shippingAddress?.fullName || ""}, ${shippingAddress?.city || ""}</p>
      <p style="margin:0 0 8px;"><strong>Items:</strong></p>
      <ul style="margin:0;padding-left:18px;">${listItemsHtml(items)}</ul>
    `,
  });

  return {
    subject: `Order confirmation - ${orderId}`,
    html,
    text: `Your order ${orderId} was placed successfully. Total: ${formatMoney(totalPrice)}.`,
  };
};

export const paymentSuccessTemplate = ({
  name,
  orderId,
  amount,
  currency = "EUR",
  paymentMethod = "Stripe",
}) => {
  const html = pageShell({
    title: "Payment successful",
    body: `
      <p style="margin:0 0 12px;">Hi <strong>${name || "there"}</strong>, your payment was successful.</p>
      <p style="margin:0 0 12px;"><strong>Order ID:</strong> ${orderId}</p>
      <p style="margin:0 0 12px;"><strong>Amount:</strong> ${formatMoney(amount, currency)}</p>
      <p style="margin:0;"><strong>Method:</strong> ${paymentMethod}</p>
    `,
  });

  return {
    subject: `Payment successful - ${orderId}`,
    html,
    text: `Payment successful for order ${orderId}. Amount: ${formatMoney(amount, currency)}.`,
  };
};

export const shipmentEmailTemplate = ({
  name,
  orderId,
  status = "Shipped",
}) => {
  const html = pageShell({
    title: "Your order has shipped",
    body: `
      <p style="margin:0 0 12px;">Hi <strong>${name || "there"}</strong>, your order is now <strong>${status}</strong>.</p>
      <p style="margin:0;"><strong>Order ID:</strong> ${orderId}</p>
    `,
  });

  return {
    subject: `Order shipped - ${orderId}`,
    html,
    text: `Your order ${orderId} is now ${status}.`,
  };
};
