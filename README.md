# Crudlify
Create automatic REST CRUD API from any data-schema. Database support for mongodDB and Codehooks.io.

## Install

`npm install crudlify`

## Usage

```js
// index.js
import app from 'codehooks-js';
import { object, string, number, date } from 'yup';
import crudlify from 'crudlify';

const userSchemaYup = object({
    name: string().required(),
    age: number().required().positive().integer(),
    email: string().email(),
    website: string().url().nullable(),
    createdOn: date().default(() => new Date()),
});

const options = {
    // schema: "yup" or "json-schema"
    // format: "standard" or "foo"
    // query: "query-to-mongo" or "mongo"
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

## Auto REST API

GET PUT POST PATCH DELETE

## Event hooks middleware

Events can be called before and after a database operation.

```js
hooks.before<VERB>(<COLLECTION>, callbackFunction)

hooks.after<VERB>(<COLLECTION>, callbackFunction)
```

Example hooks.

```js
const options = {
    schema: "json-schema"
}

const hooks = await crudlify(app, { user: userSchemaJSON }, options);

hooks.beforePOST('user', (data) => {
    console.log("Pre insert user", data)
    //throw new Error(`BAAD post for ${data}`)
    data.foo = 'Was here!'
}).afterPOST('user', (data) => {
    console.log("Post insert user", data)
})
```

## Options

* Schema: Yup or JSON.schema
* Format: Standard JSON array or ?
* Query: URL query to mongo or JSON mongo

Crudlify can be used in many combos

## App servers
* Express
* Next.js (coming soon)

## Databases
* mongoDB
* Codehooks.io

## Data schemas
* Yup
* JSON-schema

## Data formats
* React admin
* Appgyver
* MOI apps
