import express from 'express';
import cors from 'cors';
import joi from 'joi';
import { MongoClient, ObjectId } from "mongodb";
import dayjs from 'dayjs'
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
        const time = dayjs().format('HH:mm:ss');    
        const participant = req.body;
        const from = req.body.name;
       
        try {
                await db.collection('participants').insertOne({ ...participant, lastStatus: Date.now() });
                db.collection('messages').insertOne({from, to: 'Todos', text: 'entra na sala...', type: 'status', time});
                
                res.sendStatus(201);
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
        const time = dayjs().format('HH:mm:ss');


  try {
          await db.collection('messages').insertOne({ ...message, time, from: user });
    res.status(201).send(time);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


server.listen(5000)