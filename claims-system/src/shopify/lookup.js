const axios = require('axios');
const cfg   = require('../config');

const shopifyApi = axios.create({
  baseURL: `https://${cfg.shopify.domain}/admin/api/2024-04`,
  headers: {
    'X-Shopify-Access-Token': cfg.shopify.accessToken,
    'Content-Type': 'application/json',
  },
});

// ── Find customer by email ────────────────────────────────────────────────────

async function findCustomer(email) {
  const res = await shopifyApi.get('/customers/search.json', {
    params: { query: `email:${email}`, limit: 1 },
  });
  return res.data.customers?.[0] || null;
}

// ── Get most recent shipped/delivered order for a customer ────────────────────

async function getLatestShippedOrder(customerId) {
  const res = await shopifyApi.get('/orders.json', {
    params: {
      customer_id:    customerId,
      status:         'any',
      fulfillment_status: 'shipped',
      limit:          5,
      order:          'created_at desc',
    },
  });

  const orders = res.data.orders || [];
  // Prefer most recent order that has a fulfillment with a tracking number
  for (const order of orders) {
    const fulfillment = order.fulfillments?.find(f => f.tracking_number);
    if (fulfillment) {
      return { order, fulfillment };
    }
  }
  // Fall back to most recent order regardless
  if (orders.length) {
    const order = orders[0];
    return { order, fulfillment: order.fulfillments?.[0] || null };
  }
  return null;
}

// ── Enrich claim with Shopify data ────────────────────────────────────────────

async function resolveCustomerAndOrder(senderEmail) {
  const customer = await findCustomer(senderEmail);
  if (!customer) {
    return { found: false, reason: 'Email address not found in Shopify customer database.' };
  }

  const result = await getLatestShippedOrder(customer.id);
  if (!result) {
    return { found: false, reason: 'No shipped orders found for this customer.' };
  }

  const { order, fulfillment } = result;
  const carrier        = fulfillment?.tracking_company || 'Unknown';
  const trackingNumber = fulfillment?.tracking_number  || null;
  const trackingUrl    = fulfillment?.tracking_url     || null;

  // Delivery date from fulfillment shipment_status or order timeline
  const deliveredAt    = fulfillment?.shipment_status === 'delivered'
    ? fulfillment.updated_at
    : null;

  // Line items summary
  const items = (order.line_items || []).map(i => ({
    name:     i.name,
    quantity: i.quantity,
    price:    parseFloat(i.price),
    sku:      i.sku,
  }));

  const orderValue = parseFloat(order.total_price);

  return {
    found: true,
    customer: {
      id:        customer.id,
      name:      `${customer.first_name} ${customer.last_name}`.trim(),
      email:     customer.email,
      phone:     customer.phone,
    },
    order: {
      id:          order.id,
      name:        order.name,         // e.g. #CAV-1001
      createdAt:   order.created_at,
      orderValue,
      items,
      currency:    order.currency,
    },
    shipment: {
      carrier,
      trackingNumber,
      trackingUrl,
      shippedAt:   fulfillment?.created_at || null,
      deliveredAt,
    },
  };
}

module.exports = { resolveCustomerAndOrder };
