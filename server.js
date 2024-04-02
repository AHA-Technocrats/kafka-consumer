const WebSocket = require("ws");
const url = require("url");
require("dotenv").config();

// WebSocket server setup
const wss = new WebSocket.Server({
  path: "/test",
  port: process.env.PORT || 4000,
});

// Initiate kafka
const { kafkaConsumer, kafkaClient, createTopics } = require("./config/kafka");

// Map to store WebSocket clients and their subscribed topics
const clients = new Map();

// Function to handle new WebSocket connections
wss.on("connection", function connection(ws, req) {
  const query = url.parse(req.url, true).query;

  const topics = query.topics.split(",");

  console.log("connected", topics);

  // Store WebSocket connection and subscribed topics
  clients.set(ws, topics);

  // create topic if not exists
  topics.forEach((topic) => {
    createTopics(topic);
  });

  console.log("Client connected with topics:", topics);

  // Close event handler for WebSocket connection
  ws.on("close", function () {
    clients.delete(ws);
    console.log("Client disconnected");
  });
});

// Function to handle Kafka messages and send updates to connected clients
kafkaConsumer.on("message", function (message) {
  const { topic, value } = message;

  // Iterate through connected clients
  for (const [ws, subscribedTopics] of clients.entries()) {
    // Check if client is subscribed to the topic of the message
    if (subscribedTopics.includes(topic)) {
      // Send message to client
      ws.send(JSON.stringify({ topic, message: value.toString() }));
    }
  }
});

// Gracefully close Kafka client and consumer on process exit
process.on("exit", function () {
  kafkaConsumer.close(() => kafkaClient.close());
});
