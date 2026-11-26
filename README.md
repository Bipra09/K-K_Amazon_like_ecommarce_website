# K&K — E-commerce storefront

A full-stack portfolio project built with React, Express, and MongoDB. The core workflow takes a shopper from product discovery to cart management, checkout, and order history.

## Start here

| What to inspect | Where |
| --- | --- |
| Sign-up, login, and JWT issuance | [Authentication routes](server/routes/auth.js) |
| Product discovery and search | [Product routes](server/routes/products.js) and [search routes](server/routes/search.js) |
| How a cart becomes an order | [Order routes](server/routes/orders.js) and [cart model](server/models/Cart.js) |
| Storefront and API integration | [React client](client) and [Express entry point](server/index.js) |

## Engineering walkthrough

### Checkout and data ownership

The checkout route loads the signed-in user's cart, builds an order from its line items and totals, saves the order, and then clears the cart. Order history is scoped to the signed-in user, and individual order routes use an access-check middleware.

The current checkout writes the order and cart separately. An inventory-aware checkout would reserve stock with a conditional database update, then commit the stock, order, and cart changes together. A regression test should start with one unit and submit two competing checkouts, then verify that only one completes and the final stock is zero.

### Demo scope

The repository contains catalog, cart, orders, wishlist, reviews, and admin API modules. Checkout records a payment-method selection as part of the order. Payment processing, social sign-in, and recommendations are outside this walkthrough.

## Run locally

Use Node.js, npm, and a running MongoDB instance. From the repository root:

```sh
npm run install-all
cp env.example .env
npm run dev
```

Before starting the app, set `MONGODB_URI` and a local `JWT_SECRET` in `.env`. The React app runs on [localhost:3000](http://localhost:3000). Use [localhost:5000/api/health](http://localhost:5000/api/health) to check that Express is responding.

## License

[MIT](License)
