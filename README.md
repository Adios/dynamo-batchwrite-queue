# dynamo-batchwrite-queue

A simple implementation for queuing up `DynamoDB.DocumentClient.batchWrite()` in `async.queue()`.

Also implements an endless exponential retry when encounter `ProvisionedThroughtput` error.

## Requirements

I didn't use `babel`, so it needs at least `node 4.3.2` as there are some ES2015 syntax inside.

## Installation

`npm install dynamo-batchwrite-queue`

## Usage

    const queue = require('dynamo-batchwrite-queue')

    // all the same, defaults to concurrency=2.
    var qdb = queue()
    var qdb = queue(2)
    var qdb = queue(document_client_options, 2)

    // you can also put your DocumentClient instance.
    var qdb = queue(new aws.DynamoDB.DocumentClient(options), 10)

    // assume done() is the callback for your node handler.
    qdb.drain = () => done()

    // params: see DynamoDB.DocumentClient.batchWrite()
    qdb.push(params)

    // records: array of DocumentDB params to be inserted into dynamodb
    let buf = [], i = 0
    records.forEach(v => {
        i++
	buf.push(v)

        // batchWrite supports at most 25 once a time.
	if (buf.length >= 25) {
            qdb.push(buf)
	    buf = []
	    i = 0
	}
    })
    if (buf.length) qdb.push(buf)

## License

ISC
