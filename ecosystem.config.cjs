module.exports = {
    apps: [
        {
            name: 'etrade',
            script: 'npm',
            args: 'start',
            env: {
                PORT: 3005,
                NODE_ENV: 'production'
            },
            autorestart: true,
            watch: false,
            max_memory_restart: '1G'
        }
    ]
};
