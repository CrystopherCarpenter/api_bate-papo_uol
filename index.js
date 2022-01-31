/*import express, {json} from 'express';
import cors from 'cors';
import joi from 'joi';
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const server = express();

server.use(cors());
server.use(json);

const newLocal = process.env.MONGO_URI;
const mongoClient = new MongoClient(newLocal);
let db

mongoClient.connect(()=>{
                db = mongoClient.db("users");
                });

server.post('/participants', async (req, res) => {
        try {
                const products = await db.collection('users').find()
                res.send(`fui!`);

        } catch (error) {
                res.status(error).send(`não fui!`);
        }
});

server.get('/participants', (req, res) => {

})

server.post('/messages', (req, res) => {

})

server.get('/messages', (req, res) => {

})

server.post('/status', (req, res) => {

})

server.listen(5000);
*/

import express from 'express';
import cors from 'cors';
import joi from 'joi';
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect(() => {
  db = mongoClient.db("bate-papo");
});

const server = express();
server.use(cors());
server.use(express.json());

server.post('/participants', async (req, res) => {
        try {
                const participant = req.body;
                
                await db.collection('participants').insertOne({ ...participant, lastStatus: Date.now() });
                
                res.status(201).send({ ...participant, lastStatus: Date.now() });
        } catch (error) {
                res.sendStatus(422);
        }
});

server.get('/participants', async (req, res) => {
  try {
    const participants = await db.collection('participants').find().toArray();
    res.send(participants);
  } catch (error) {
    res.sendStatus(500);
  }
});

server.post('/messages', async (req, res) => {
        const message = req.body;
        const user = req.headers.user;
  try {
          await db.collection('messages').insertOne({ ...message, time: "Hh", from: user });
    res.status(201).send();
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});



server.listen(5000)