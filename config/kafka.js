const { KafkaClient, Consumer } = require("kafka-node");

// Kafka setup
const kafkaClient = new KafkaClient({ kafkaHost: process.env.KAFKA_HOST });

const kafkaConsumer = new Consumer(kafkaClient, [], {
  autoCommit: true, //to commit and not repeat when server restart
});

kafkaClient.on("connect", function () {
  console.log("Kafka client connected:");
});

// Error handler for Kafka consumer
kafkaConsumer.on("error", function (error) {
  console.error("Error in Kafka consumer:", error);
});

// Close event handler for Kafka consumer
kafkaConsumer.on("close", function () {
  console.log("Kafka consumer closed");
});

kafkaConsumer.on("message", function () {
  console.log("Kafka consumer message");
});

// Close event handler for Kafka client
kafkaClient.on("error", function (error) {
  console.error("Error in Kafka client:", error);
});

// Create topics if not exists
createTopics = (topic = []) => {
  kafkaClient.topicExists([topic], (error, result) => {
    if (!error) {
      kafkaClient.createTopics(
        [{ topic: topic, partitions: 1, replicationFactor: 1 }],
        (error, result) => {
          if (error) console.error(error);
          else console.log(result);
        }
      );
      kafkaConsumer.addTopics([topic]);
    }
  });
};

module.exports = { kafkaConsumer, kafkaClient, createTopics };
