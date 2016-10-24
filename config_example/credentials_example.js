module.exports = {
    mysql: {
        dev: {
            connectionString: 'mysql://root:@127.0.0.1:3306/'
        },
        product: {
            connectionString: 'mysql://${username}:${password}@${host}:${port}/'
        }
    }
};
