// Configuração inicial
const express = require('express')
const app = express()
const token = require('./token')
const request = require('request')

app.use(express.json())
app.use(
    express.urlencoded({
        extended: true,
    }),
)

const user = '266826';
const subscription = '266826-0001';

const PRIMAVERA_BASE_URL = `https://my.jasminsoftware.com/api/${user}/${subscription}`;

const getToken = async () => { 
    return await token.getToken();
}

app.get('/getSales', async (req, res)=>{
    const options = {
        'method': 'GET',
        'url': `${PRIMAVERA_BASE_URL}/salescore/customerparties/odata`,
        'headers': {
            'Authorization': `Bearer ${await getToken()}`
        }
    }

    request(options, function (err, response) {
        if (err) throw new Error(err);
        const obj = JSON.parse(response.body);

        res.status(200).json(obj);
    })
})

app.post("/getStock", async (req, res) => {
    let componentes = req.body.componentes;
    console.log(componentes);

    let filter = `ItemKey eq '${componentes[0]}'`;
    if (componentes.length > 1) {
        for(let i = 1; i < componentes.length; i++){
            filter += ` or ItemKey eq '${componentes[i]}'`;
        }
    }

    console.log(filter)

    const options = {
        'method': 'GET',
        'url': `${PRIMAVERA_BASE_URL}/materialscore/materialsItems/odata?filter=${filter}`,
        'headers': {
            'Authorization': `Bearer ${await getToken()}`
        }
    }

    request(options, function (err, response) {
        if (err) throw new Error(err);
        const obj = JSON.parse(response.body);

        if(obj) {
            res.status(200).json(obj);
        }     
    })
})

app.post("/criarFatura", async (req, res) => {
    let componentes = req.body;
    console.log(componentes);

    // const options = {
    //     'method': 'GET',
    //     'url': `${PRIMAVERA_BASE_URL}/materialscore/materialsItems/odata?filter=${filter}`,
    //     'headers': {
    //         'Authorization': `Bearer ${await getToken()}`
    //     }
    // }

    // request(options, function (err, response) {
    //     if (err) throw new Error(err);
    //     const obj = JSON.parse(response.body);

    //     if(obj) {
    //         res.status(200).json(obj);
    //     }     
    // })
})

// EndPoint
app.get('/', (req,res)=>{

    // Mostrar a requisição

    res.json({mensagem: 'Sinal recebido!' })

})

app.listen(3000)