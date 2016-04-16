'use strict'

const async = require('async')
const aws = require('aws-sdk')

function Q (opts, concurrency) {
    if (!(this instanceof Q)) {
        return new Q(opts, concurrency)
    }

    this.con = 2
    if (concurrency) {
        this.con = concurrency
    }

    this.c = undefined
    if (typeof opts === 'number') {
        this.con = opts
    } else if (opts instanceof aws.DynamoDB.DocumentClient) {
        this.c = opts
    }

    if (!this.c) {
        this.c = new aws.DynamoDB.DocumentClient(opts)
    }

    this.q = async.queue((task, cb) => task(cb), this.con)
}

Q.prototype = {
    set drain (fn) {
        this.q.drain = fn
    }
}

Q.prototype.push = function (params) {
    let q = this.q,
        c = this.c
    retryable_batch_write(q, c, params, 25)
    return this
}

function retryable_batch_write (q, c, params, delay) {
    q.push(cb => {
        setTimeout(() => {
            c.batchWrite(params, (err, data) => {
                if (err) {
                    if (err.code === 'ProvisionedThroughputExceededException' && err.retryable) {
                        retryable_batch_write(q, c, params, delay * 2)
                    }
                    else throw err
                }
                else if (data) {
                    let is = data.UnprocessedItems
                    if (is && Object.keys(is).length) {
                        retryable_batch_write(q, c, {
                            RequestItems: is
                        }, delay * 2)
                    }
                }

                cb()
            })
        }, delay)
    })
}

module.exports = Q
