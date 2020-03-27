const Heavvy = require('../src/heavvy')
const script = require.resolve('./workers/versatile')
const pool = new Heavvy(script, 4, ['getPassword', 'getRandom'])

const tasksCount = 10

for (let i = 1; i <= tasksCount; i++) {
    pool.getPassword().then(msg => {
        console.log(`${i}) getPassword: ${msg.payload.value}`)
    })

    pool.getRandom({
        payload: {
            durationMs: 3000,
        },
    }).then(msg => {
        console.log(`${i}) getRandom: ${msg.payload.value}`)
    })
}