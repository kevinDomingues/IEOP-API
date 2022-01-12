const axios = require('axios');
const { runMain } = require('module');
const queryString = require('querystring');

const user = 'IEOPJASMINAPI';
const secret = '121fb85a-3b65-4a57-b1fb-dde923e28f50';

const tokenUrl = 'https://identity.primaverabss.com/connect/token';

const user_data = {
    auth: {
        username: user,
        password: secret,
    }
};
const form_data = queryString.stringify({
    grant_type: 'client_credentials',
    scope: 'application'
})
async function getToken() {
    return await axios.post(tokenUrl, form_data, user_data)
            .then((res) => res.data.access_token)
            .catch((error) => console.log(error))
}
module.exports = {
    getToken
}