const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");
const redis = new Redis();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { 
    cors : {
        origin :'http://localhost:5500',
        methods : ["GET","POST"]
    }
 });

app.use(express.json());
app.use(express.urlencoded({extended: true}));

io.on("connection", (socket) => {
  console.log('A new user connected: ' + socket.id);
  
  socket.on("setUserId", (userId) => {
    redis.set(userId, socket.id);
  });

  socket.on('getConnectionId', async (userId) => {
    try {
      const connId = await redis.get(userId);
      socket.emit('connectionId', connId);
      console.log(connId);
    } catch (err) {
      console.error('Error fetching connection ID:', err);
    }
  });
});

app.post('/sendPayload',async (req,res)=>{
    const {userId,payload} = req.body;
    if(!userId || !payload){
        res.status(400).send("Invalid request");
    }
    const socketId = await redis.get(userId);
    if(socketId){
        io.to(socketId).emit('submissionPayloadResponse',payload);
        res.send('payload sent successfully');

    }else {
        res.status(400).send("User not connected");
    }
})

httpServer.listen(3000, () => {
    console.log("Server is running on port 3000");
});
