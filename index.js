// Configuração inicial
const express = require('express')
const app = express()
const token = require('./token')
const request = require('request')

const fs = require('fs');
const readline = require('readline');
const moment = require('moment');

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

app.post("/getItemsForSale", async (req, res) => {
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
        'url': `${PRIMAVERA_BASE_URL}/salesCore/salesItems/odata?filter=${filter}`,
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
    let item = req.body.salesItem;
    let buyerCustomerParty = req.body.buyerCustomerParty;
	let email = req.body.email;
	//data e converter para rfc3339
	let dateTime = new Date();
	let dateTimeFormatted = dateTime.toISOString();

    let documentLines = {
        salesItem: item,
        quantity: 1,
        warehouse: "01"
    }

    let body = {
        "company": "SI",
        "documentType": "FA",
        "buyerCustomerParty": buyerCustomerParty,
        "emailTo": email,
        "documentDate": dateTimeFormatted,
        "documentLines": documentLines
    }

    const options = {
        'method': 'POST',
        'url': `${PRIMAVERA_BASE_URL}/billing/invoices`,
        'headers': {
            'Authorization': `Bearer ${await getToken()}`,
        },
        'body': body,
        json: true
    }

    const filename = `FATURA_${moment().unix()}.pdf`;
    const filepath = `./public/${filename}`;
    let file = fs.createWriteStream(filepath);
    let print = `${PRIMAVERA_BASE_URL}/billing/invoices/${body}/print`;

    request(options, async function (err, response, body) {
        if (err){
            res.status(400).json({
                status: false,
                message: "Dados inválidos"
            });
            return;
        }
        if (body) {
            request({
                uri: print,
                headers: {
                    'Authorization': `Bearer ${await getToken()}`,
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'max-age=0',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            }).pipe(file).on('finish', () => {
                res.status(200).json({
                    link: `http://localhost:3000/files?filename=${filename}`
                })
            }).on('error', (error) => {
                console.log(error)
                res.status(500).json({})
            })
        }
    })
})

app.post("/criarEncomenda", async (req, res) => {
    if (typeof req.body.salesItem === "undefined") {
		res.status(400).json({
			status: false,
			message: "salesItem inválido: " + req.body.salesItem
		});
		return;
	}
	if (typeof req.body.buyerCustomerParty === "undefined") {
		res.status(400).json({
			status: false,
			message: "buyerCustomerParty inválido: " + req.body.buyerCustomerParty
		});
		return;
	}
	if (typeof req.body.email === "undefined") {
		res.status(400).json({
			status: false,
			message: "email inválido: " + req.body.email
		});
		return;
	}

    let salesItem = req.body.salesItem;
    let buyerCustomerParty = req.body.buyerCustomerParty;
	let email = req.body.email;
	//data e converter para rfc3339
	let dateTime = new Date();
	let dateTimeFormatted = dateTime.toISOString();

    // console.log(salesItem + buyerCustomerParty + email + dateTimeFormatted);
    // return;

    let body = {
        "company": "SI",
        "documentType": "ECL",
        "buyerCustomerParty": buyerCustomerParty,
        "emailTo": email,
        "documentDate": dateTimeFormatted,
        "documentLines": [{ "salesItem": salesItem }]
    }

    const options = {
        'method': 'POST',
        'url': `${PRIMAVERA_BASE_URL}/sales/orders`,
        'headers': {
            'Authorization': `Bearer ${await getToken()}`
        },
        'body': body,
        json: true
    }

    request(options, async function (err, response, body) {
        console.log(response);
        if (err){
            res.status(400).json({
                status: false,
                message: "Dados inválidos"
            });
            return;
        }
        if (body) {
            res.status(201).json({
                status: true,
                message: body
            });
        } else {
            res.status(400).json({
                status: false,
                message: "Bad Request"
            });
        }   
    })
})

// EndPoint
app.get('/', (req,res)=>{

    // Mostrar a requisição

    res.json({mensagem: 'Sinal recebido!' })

})

app.listen(3000)