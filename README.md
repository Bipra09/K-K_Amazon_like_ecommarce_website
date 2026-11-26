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

Checkout reserves inventory with conditional stock updates. MongoDB commits the reservation, order, and cart clear in one transaction. If an item sells out, the API returns HTTP 409 and preserves the cart. Product prices are read from the catalog during checkout. The [integration workflow](.github/workflows/checkout.yml) covers last-unit contention and rollback for a partly available cart.

### Demo scope

The repository contains catalog, cart, orders, wishlist, reviews, and admin API modules. Checkout records a payment-method selection as part of the order. The storefront uses a cash-on-delivery demo flow.

## Run locally

Use Node.js, npm, and MongoDB Atlas or a local MongoDB replica set. Checkout requires transaction support. From the repository root:

```sh
npm run install-all
cp env.example .env
npm run dev
```

Before starting the app, set `MONGODB_URI` and a local `JWT_SECRET` in `.env`. The React app runs on [localhost:3000](http://localhost:3000). Use [localhost:5000/api/health](http://localhost:5000/api/health) to check that Express is responding.

## License

[MIT](License)
