# Codehooks-crudlify

Database CRUD automation for node.js.

## Install

`npm install codehooks-crudlify`

## Usage

```js
// index.js
import app from 'codehooks-js';
import { object, string, number, date } from 'yup';
import crudlify from 'codehooks-crudlify';

const userSchemaYup = object({
    name: string().required(),
    age: number().required().positive().integer(),
    email: string().email(),
    website: string().url().nullable(),
    createdOn: date().default(() => new Date()),
});

const options = {
    // schema: "yup" || "json-schema"
    // format: "standard" || "foo"
    // query: "query-to-mongo" || "mongo"
    // database: "mongodb" || "dynamodb"
}

crudlify(app, {user: userSchemaYup}, options)

export default app.init();
```

Deploy to codehooks.io with `coho deploy index.js`. 

Alternatively run and mangage it yourself, shown below.

## Run standalone express server and mongoDB

Create a separate `standalone.js` file to provide a runtime for the `index.js` app.

```js
// standalone.js
import coho from './index.js';
import mongoStore from 'codehooks-mongodb';
import express from 'express';
import bodyParser from 'body-parser';
const app = express();
import Debug from "debug";
const debug = Debug("codehooks-standalone");

app.use(bodyParser.json({ limit: '10mb' }));

const options = {
    "datastore": new mongoStore('mongodb://localhost:27017')
}

// important, make codehooks use express and MongoDB
coho.app.useExpress(app, options);

app.listen(3000, () => {
    console.log("Running standalone on port 3000")
})
```

Start the server with `node standalone.js`

## Automatic database REST APIs

GET PUT POST PATCH DELETE

## Database event hooks middleware

Events can be called before and after a database operation.

```js
hooks.before<VERB>(<COLLECTION>, callbackFunction)

hooks.after<VERB>(<COLLECTION>, callbackFunction)
```

Example event hooks is shown below.

```js
...
const options = {
    schema: "json-schema"
}

const hooks = await crudlify(app, { user: userSchemaJSON }, options);

hooks
.beforePOST('user', (data) => {
    console.log("Pre insert user before saving", data)

    // abort operation with a throw, cases 404 status code
    // E.g. throw new Error(`BAAD post for ${data}`)

    // mutate data before saved to the database
    data.foo = 'Was here!'
})
.afterPOST('user', (data) => {
    console.log("Post insert user after saved to the database", data)
})
...
```

## Options

* Schema: yup or json.schema. Default yup.
* Format: Standard JSON array or ?
* Query: URL query to mongo (q2m) or JSON mongo. Default q2m

Crudlify can be used in many scenarios.

## App servers
* Express
* Next.js (coming soon)

## Databases
* mongoDB
* Codehooks.io

## Data schemas
* Yup
* JSON-schema

## JSON data formats
* React admin
* Appgyver
* MOI apps
