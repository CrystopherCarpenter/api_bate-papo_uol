import express from 'express';
import cors from 'cors';
import joi from 'joi';
import { MongoClient} from "mongodb";
import dayjs from 'dayjs';
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
        const schema = joi.object({
                name: joi.string().required()
        });

        const validation = schema.validate(participant);

        if (validation.error) {
                res.sendStatus(422);
                return;
        }

        if (await db.collection('participants').findOne({ name: participant.name })) {
                res.sendStatus(409);
                return;
        }
        try{
        await db.collection('participants').insertOne({ ...participant, lastStatus: Date.now() });
        db.collection('messages').insertOne({from, to: 'Todos', text: 'entra na sala...', type: 'status', time});
        
                res.sendStatus(201);
        } catch {
                res.sendStatus(500)
        }
});

server.get('/participants', async (req, res) => {
        const participants = await db.collection('participants').find().toArray();
        res.send(participants);
});

server.post('/messages', async (req, res) => {
        const from = req.headers.user;
        const participants = [];
        const usersOnline = await db.collection('participants').find().toArray();
        usersOnline.forEach((participant => {
                participants.push(participant.name);
        }))
        const message = { ...req.body, from };
        const schema = joi.object({
                to: joi.string().required(),
                text: joi.string().required(),
                type: joi.any().valid('message', 'private_message'),
                from: joi.any().valid(...participants),
        });
        const validation = schema.validate(message);
        const time = dayjs().format('HH:mm:ss');

        if (validation.error) {
                res.sendStatus(422);
                return;
        }
        try{
        await db.collection('messages').insertOne({...message, time});
        res.sendStatus(201);
        } catch {
                res.sendStatus(500)
        }
});

server.get('/messages', async (req, res) => {
        const user = req.headers.user;
        const limit = parseInt(req.query.limit);
        const messages = await db.collection('messages').find({
                $or: [{
                        $and: [
                                { type: { $in: ['message', 'status'] } },
                                { to: 'Todos' }]
                },
                { to: user },
                { from: user }
                ]}).toArray();
                limit ? res.send(messages.slice(-limit)) : res.send(messages);
});

server.post('/status', async (req, res) => {
        const user = req.headers.user;
        const participant = await db.collection('participants').findOne({ name: user });
        if (!participant) {
                res.sendStatus(404);
                return;
        }
        try{
        await db.collection('participants').updateOne({ name: user }, { $set: { lastStatus: Date.now() } });
        res.sendStatus(200);
        } catch {
                res.sendStatus(500)
        }
});

setInterval(async () => {
        const participants = await db.collection('participants').find().toArray();
        participants.forEach(async (participant) => {
                if ((Date.now() - participant.lastStatus) > 10000) {
                        const time = dayjs().format('HH:mm:ss');
                        await db.collection('participants').deleteOne({ name: participant.name });
                        db.collection('messages').insertOne({from: participant.name, to: 'Todos', text: 'sai da sala...', type: 'status', time});
                }})}, 15000);

server.listen(5000)