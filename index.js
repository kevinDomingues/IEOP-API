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

app.get("/getItemsForSale", async (req, res) => {
    const options = {
        'method': 'GET',
        'url': `${PRIMAVERA_BASE_URL}/salesCore/salesItems/odata`,
        'headers': {
            'Authorization': `Bearer ${await getToken()}`
        }
    }

    request(options, function (err, response) {
        if (err) throw new Error(err);
        const obj = JSON.parse(response.body);

        if(obj) {
            // console.log(obj);
            let array = [];

            obj.items.forEach(element => {
              try{
                let car = {
                    KeyCarro: element.itemKey,
                    Marca: element.brand,
                    Modelo: element.description,
                    Estado: "Usado-Semi-Novo",
                    Preco: element.priceListLines[0].priceAmountAmount
                }
                array.push(car);
              }catch(error){
                console.log('Não enviado - Não contém os requisitos');
              }
            });
            res.status(200).json(array);
        }     
    })
})

app.post("/criarFatura", async (req, res) => {
    let item = req.body.salesItem;
    let buyerCustomerParty = req.body.Cliente;
	let email = req.body.Email;
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
	if (typeof req.body.Cliente === "undefined") {
		res.status(400).json({
			status: false,
			message: "buyerCustomerParty inválido: " + req.body.Cliente
		});
		return;
	}
	if (typeof req.body.Email === "undefined") {
		res.status(400).json({
			status: false,
			message: "email inválido: " + req.body.Email
		});
		return;
	}

    let salesItem = req.body.salesItem;
    let buyerCustomerParty = req.body.Cliente
	let email = req.body.Email;
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