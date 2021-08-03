const mqtt = require('mqtt');

module.exports = { initMQTT };

function initMQTT() {
    const options = {
        clean: true,
        connectTimeout: 10000,
        clientId: "nodecollect"
    };

    const url = "tcp://mqtt:1883";
    const client = mqtt.connect(url, options);

    client.on("connect", () => {
        console.log("MQTT: connected");

        client.subscribe("requestNodeCollect");
    });

    client.on("message", (topic, message) => {
        let data = {};
        data.topic = topic;
        data.message = message.toString();

        console.log("MQTT: ", data);
    });

    return client;
}