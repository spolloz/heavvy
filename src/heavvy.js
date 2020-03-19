const { Worker, isMainThread } = require('worker_threads')

const status = {
    IDLE: 'IDLE',
    BUSY: 'BUSY',
}

module.exports = class {
    constructor(script, poolSize = 4) {
        this.script = script
        this.poolSize = poolSize
        this.pool = []
        this.taskQueue = []

        this._init()
    }

    setWCStatus(worker, status) {
        const wC = this.pool.find(_ => _.worker === worker)

        wC.status = status
    }

    getWCByStatus(status) {
        return this.pool.find(_ => _.status === status)
    }

    _init() {
        for (let i = 0; i < this.poolSize; i++) {
            const worker = new Worker(this.script)

            this.pool.push({
                worker,
                status: status.IDLE,
            })
        }
    }

    logWC(wC) {
        const { worker, status } = wC

        console.log(`The ${status}:${worker.threadId}:worker has started its work lately`)
    }

    setTask(task) {
        this.taskQueue.push(task)
    }

    getTask() {
        return this.taskQueue.shift()
    }

    runQueuedTask() {
        const task = this.getTask()

        if (task) {
            const { data, res, rej } = task

            this.run(data)
                .then(res)
                .catch(rej)
        }
    }

    run(data) {
        return new Promise((res, rej) => {
            const wC = this.getWCByStatus(status.IDLE)

            if (!wC) {
                this.setTask({
                    data,
                    res,
                    rej,
                })
            } else {
                this.setWCStatus(wC.worker, status.BUSY)

                wC.worker.once('message', msg => {
                    this.setWCStatus(wC.worker, status.IDLE)
                    res(msg)

                    this.runQueuedTask()
                })

                wC.worker.on('error', err => {
                    this.setWCStatus(wC.worker, status.IDLE)
                    rej(err)

                    this.runQueuedTask()
                })

                wC.worker.postMessage(data)
            }
        })
    }
}
