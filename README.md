# Codehooks-crudlify

Easy database REST API CRUD automation for Node.js. Use this open source package for easy creation of REST APIs and persistent storage for backend applications. This package requires use of [codehooks-js](https://www.npmjs.com/package/codehooks-js) together with a codehooks.io backend or using Express/MongoDB with the open source [codehooks-mongodb](https://www.npmjs.com/package/codehooks-mongodb) library.

## Data and validation schemas

Codehooks-crudlify supports these popular data and validation schemas:
* [Yup](https://www.npmjs.com/package/yup) - Dead simple Object schema validation
* [Zod](https://www.npmjs.com/package/zod) - TypeScript-first schema validation with static type inference
* [JSON.schema](https://www.npmjs.com/package/ajv) - Standard declarative language that allows you to annotate and validate JSON documents

## Install

Create a new directory for your project. Then initialize with npm and JavaScript ES6.

`npm init es6`

Install dependent packages.

`npm install codehooks-crudlify codehooks-js yup`

## Usage

Create a Node.js Codehooks backend app like the example shown below. This example uses [Yup](https://www.npmjs.com/package/yup) as data schema.

```js
// index.js
import app from 'codehooks-js';
import { object, string, number, date } from 'yup';
import crudlify from 'codehooks-crudlify';

// database schema
const userSchemaYup = object({
    name: string().required(),
    age: number().required().positive().integer(),
    email: string().email(),
    website: string().url().nullable(),
    createdOn: date().default(() => new Date()),
});

const options = {
    // schema: "yup" (default)
    // schema: "json-schema"
    // schema: "zod"
}

// Make REST API CRUD operations for user collection with Yup schema
crudlify(app, {user: userSchemaYup}, options)

export default app.init(); // export app to a runtime server engine
```

## Deploy application to the codehooks.io cloud service

Using the [Codehooks CLI](https://www.npmjs.com/package/codehooks) you can deploy the app to with the `coho deploy` command.

> Tip: Inspect the app output using the `coho logs -f` command. 

Alternatively run and manage it yourself with Express and mongoDB, this is shown in the next section.

## Run application with Express server and MongoDB

In case you wish to develop and host the application yourself, just follow the recipe explained in this section. 

You need to add one extra file, e.g. `standalone.js`. The code in this file will provide a separate runtime server for the app shown above (the `index.js` file).

Install the [codehooks-mongodb](https://www.npmjs.com/package/codehooks-mongodb) and the other necessary packages to support Express and MongoDB. Also make sure that your app is set up to use the required JavaScript ES6, either by running `npm init es6` or by adding `"type": "module"` in the `package.json` file.

`npm install codehooks-mongo express body-parser`

```js
// standalone.js
import coho from './index.js'; // import the codehooks app scope
import mongoStore from 'codehooks-mongodb';
import express from 'express';
import bodyParser from 'body-parser';
const app = express();

// add any necessary express configuration you like
app.use(bodyParser.json({ limit: '10mb' }));

const options = {
    // replace this with the mondoDB connection string you like
    "datastore": new mongoStore('mongodb://localhost:27017') 
}

// Important, make codehooks use express and MongoDB
coho.useExpress(app, options);

// Start the server
app.listen(3000, () => {
    console.log("Running standalone on port 3000")
})
```

Start the server with `node standalone.js` and you should see this message in the console.

```bash
$ node standalone.js

Running standalone on port 3000
```

## Automatic REST API
By using the `crudlify(app, schema)` function, your Codehooks.io app effectively gets a complete HTTP CRUD  REST API with schema validation and data persistence for your application collections.

Crudlify will create the following REST API endpoints for any collection defined in your schema:

| Verb  | Codehooks.io route  | Description  |
|:---|---|---|
| `GET`  | https://{TENANT-ID}/{SPACE}/:collection  | Retrieve all objects (filtered by query)  |
| `GET`  | https://{TENANT-ID}/{SPACE}/:collection/:ID  | Retrieve object by ID  |
| `POST` | https://{TENANT-ID}/{SPACE}/:collection  | Add object  | 
| `PUT`  | https://{TENANT-ID}/{SPACE}/:collection/:ID  | Replace object by ID  | 
| `PATCH`  | https://{TENANT-ID}/{SPACE}/:collection/:ID  | Update object by ID  | 
| `PATCH`  | https://{TENANT-ID}/{SPACE}/:collection/_byquery  | Update object(s) by query  | 
|`DELETE`| https://{TENANT-ID}/{SPACE}/:collection/:ID  | Delete object by ID  | 
|`DELETE`| https://{TENANT-ID}/{SPACE}/:collection/_byquery  | Delete object(s) by query  | 

`TENANT-ID` and `SPACE` for a Codehooks app is represented with the application endpoint URL. 

For example:

`https://myapp-xxff.api.codehooks.io/dev/user`

Or if you run the application locally use,

`http://localhost:3000/dev/user`

## Examples

### Insert a new `user` to the database

POST a new user using curl.

```bash
curl -X POST \
  'http://localhost:3000/dev/user' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "name": "Ally",
  "email": "ally@example.com"
}'
```

### Validate data against a Yup data schema

Check that the data schema validates correctly by sending an invalid email address.

```bash
curl -X POST \
  'http://localhost:3000/dev/user' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "name": "Sally",
  "email": "sally.example.com"
}'
```

Validation error shows that Yup works.

```bash
400 Bad Request

{
  "value": {
    "active": true,
    "email": "sally.example.com",
    "name": "Sally"
  },
  "path": "email",
  "type": "email",
  "errors": [
    "email must be a valid email"
  ],
  ... # chopped error message
}
```

### Run a query against the database

```bash
curl -X GET \
  'http://localhost:3000/dev/user?name=Ally' \
  --header 'Content-Type: application/json' 
```

Example output.

```json
[
  {
    "_id": "63fb97825f624f479034eb08",
    "active": true,
    "email": "ally@example.com",
    "name": "Ally"
  }
]
```

### Update a record in the database

```bash
curl -X PATCH \
  'http://localhost:3000/dev/user/63fb97825f624f479034eb08' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "name": "Ally Mc. Beal"
}'
```

## Querying the database

You can query the database REST API in two different ways.

**Simple** to use and quick queries with the URL query language:

```url
http://localhost:3000/dev/user?name=jane&age>23&limit=2&offset=5&sort=email&fields=name,age
```

Which actually produces this query object:

```js
{ name: 'Jane', age: { '$gt': 23 } }, {
  fields: { name: 1, age: 1 },
  sort: { email: 1 },
  skip: 5,
  limit: 2,
  projection: { name: 1, age: 1 }
}
```

For **advanced** use, and programmatic approact, pass inn the full JSON query and hints as URL objects:

```url
http://localhost:3000/dev/user?q={"name": "Jane", "age": {"$gt": 23}}&h={"fields": { "name": 1, "age": 1 },"sort": {"email": 1 },"skip": 5,"limit": 2,"projection": { "name": 1, "age": 1 }}
```
The last option would probably use `JSON.stringify(query)` etc. to produce a valid query in the URL.


## Database event hooks middleware

To provide additional CRUD logic, events are triggered before and after a database operation.

```js
hooks.before<VERB>(<COLLECTION>, handlerFunction)

hooks.after<VERB>(<COLLECTION>, handlerFunction)
```

Example event hooks is shown in the code example below.

```js
...
const options = {
    schema: "json-schema"
}

crudlify(app, {user: userSchemaYup}, options).then((hooks) => {

  hooks.beforePOST('user', async (data) => {
      console.log("User data before saving", data)

      // abort operation with a throw, cases 404 status code
      // E.g. throw new Error(`BAAD post for ${data}`)

      // mutate data before saved to the database
      data.foo = 'Was here!'
  })
  hooks.afterPOST('user', async (data) => {
      console.log("User data after saved to the database", data)
  })

...
```

## Options

To use [json-schema](https://json-schema.org/) instead of yup initialize crudlify with the `schema` option.

```js
crudlify(app, {user: userSchemaJSON}, {schema: "json-schema"})
```


## Quick start

For a quick start you can create an app without any schema or validation. This effectively gives you a CRUD REST API for any collection. The example below shows a bare bone example backend application.

```js
// index.js
import app from 'codehooks-js';
import crudlify from 'codehooks-crudlify';

// Make REST API CRUD operations for any collection no schema
crudlify(app)

export default app.init(); // export app to serverless runtime
```

Deploy with `coho deploy` or to Express locally like shown in the examples above.

## Documentation
* [Database API](https://codehooks.io/docs/nosql-database-api)
* [App events](https://codehooks.io/docs/appeventapi)
* [Queue workers](https://codehooks.io/docs/queuehooks)
* [CRON job workers](https://codehooks.io/docs/jobhooks)
* [codehooks-mongodb](https://www.npmjs.com/package/codehooks-mongodb) 
