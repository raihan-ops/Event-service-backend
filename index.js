const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;


const SSLCommerzPayment = require('sslcommerz');

const { v4: uuidv4 } = require('uuid');




// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2lkoa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        console.log("database conected");
        const database = client.db('Event-Mangement');
        const EventCollection = database.collection('events');
        const PurchaseCollection = database.collection('purchase');
        const usersCollection = database.collection('user')
        
        const SslPayment = database.collection('sslPayment');

        


        // -------------------------------------------------------------------
        // get multiple item
        app.get('/events', async (req, res) => {
            const cursor = EventCollection.find({});
            const service = await cursor.toArray();

            res.send(service);
        })

        //get single item
        app.get('/events/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const singleEvent = await EventCollection.findOne(query);

            res.send(singleEvent);
        })

        // Post a single event
        app.post('/events', async (req, res) => {
            const addEvent = req.body;
            // console.log(appointment);
            const result = await EventCollection.insertOne(addEvent);
            // console.log(result);
            res.json(result)
        });

        // delete single event
        app.delete('/events/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await EventCollection.deleteOne(query);

            res.send(result);
        })
        // update single event
        app.put('/events/:id', async (req, res) => {
            const id = req.params.id;

            const updateValue = req.body;


            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    event: updateValue.event,
                    timeDuration: updateValue.timeDuration,
                    details: updateValue.details,
                    price: updateValue.price,
                    workers: updateValue.workers,
                    image: updateValue.image
                },
            };
            const cursor = await EventCollection.updateOne(query, updateDoc, options);

            res.json(cursor);
        })



        // ---------------------------------------------------------------------------------------------
        // insert one purchase
        app.post('/purchase', async (req, res) => {
            const purchase = req.body;
            // console.log(appointment);
            const result = await PurchaseCollection.insertOne(purchase);
            console.log(result);
            res.json(result)
        });

        // ----------------------------------------------------------------------------------------------

        // save user info in mongodb........................
        // post for a single user 
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            // console.log(result);
            res.json(result);
        });

        // put for google sign in 
        app.put('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });


        // make admin and also verify user admin or not
        app.put('/admin', async (req, res) => {
            const user = req.body.email;
            console.log(user);

            const filter = { email: user };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);


        });

        // get admin 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // get user by email 
        app.get('/eventlist', async (req, res) => {
            const email = req.query.email;


            const query = { email: email }
            // console.log(query);

            const cursor = PurchaseCollection.find(query);
            const results = await cursor.toArray();
            res.json(results);
        })



        // get all purchaseList
        app.get('/orderlist', async (req, res) => {

            const cursor = PurchaseCollection.find({});
            const results = await cursor.toArray();
            res.json(results);
        })

        // update purchase status
        app.put('/orderlist/:id', async (req, res) => {
            const id = req.params.id;
            const updateStatus = req.body;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: updateStatus.status
                },
            };
            const cursor = await PurchaseCollection.updateOne(query, updateDoc, options);

            res.json(cursor);
        })



        // ----------------------------------------------------------------
        // delete single booking
        // find one
        app.get('/eventlist/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const user = await PurchaseCollection.findOne(query);

            res.send(user);
        })
        // update
        app.put('/eventlist/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;

            const query = { _id: ObjectId(id) };

            const updateDoc = {
                $set: {
                    payment: payment
                }
            }
            const result = await PurchaseCollection.updateOne(query, updateDoc);

            res.send(result);
        })
        // delete one
        app.delete('/eventlist/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const user = await PurchaseCollection.deleteOne(query);

            res.send(user);
        })

        
        // _______________________________________________________________________________________________________
        // ssl commerse
        //sslcommerz init
        app.post('/init', async (req, res) => {
            console.log(req.body);
            const data = {
                total_amount: req.body.price,
                // uuidv4()
                // user_order_id:req.body.SslCommerce.user_order_id,
                currency: 'BDT',
                tran_id: req.body.user_order_id,
                payment_status: 'pending',
                success_url: 'https://lit-savannah-85898.herokuapp.com/success',
                fail_url: 'https://lit-savannah-85898.herokuapp.com/fail',
                cancel_url: 'https://lit-savannah-85898.herokuapp.com/cancel',
                ipn_url: 'https://lit-savannah-85898.herokuapp.com/ipn',
                shipping_method: 'Courier',
                product_name: req.body.productName,
                product_category: 'Electronic',
                product_profile: 'general',
                cus_name: req.body.cusName,
                cus_email: req.body.cusEmail,
                cus_add1: 'Dhaka',
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: '01711111111',
                cus_fax: '01711111111',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
                multi_card_name: 'mastercard',
                value_a: 'ref001_A',
                value_b: 'ref002_B',
                value_c: 'ref003_C',
                value_d: 'ref004_D'
            };
            const result = await SslPayment.insertOne(data);
            const sslcommer = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PASSWORD, false) //true for live default false for sandbox
            sslcommer.init(data).then(data => {
                //process the response that got from sslcommerz 
                //https://developer.sslcommerz.com/doc/v4/#returned-parameters
                if (data.GatewayPageURL) {
                    res.json(data.GatewayPageURL);
                    console.log(data.GatewayPageURL);
                }
                else {
                    return res.status(400).json({ message: 'payment session failed' })
                }

            });


        })

        app.post('/success', async (req, res) => {
            console.log(req.body);
            const pay = await SslPayment.updateOne({ tran_id: req.body.tran_id }, {
                $set: {
                    val_id: req.body.val_id,
                    payment_status: 'success'
                }
            })
            const check = req.body.tran_id;

            const query = { _id: ObjectId(check) };

            const doc = {
                $set: {
                    payment2: 'SSL'
                }
            }
            const update = await PurchaseCollection.updateOne(query, doc);
            res.status(200).redirect('https://event-manage-system-2a080.web.app/success');
        })
        app.post('/fail', async (req, res) => {
            const pay = SslPayment.deleteOne({ tran_id: req.body.tran_id });
            res.status(200).redirect('https://event-manage-system-2a080.web.app/chekout');
        })
        app.post('/cancel', async (req, res) => {
            const pay = SslPayment.deleteOne({ tran_id: req.body.tran_id });
            res.status(200).redirect('https://event-manage-system-2a080.web.app/checkout');
        })



    }
    finally {

    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send(" Event is runnig");
})

app.listen(port, () => {

    console.log("server is runnig", port);
})