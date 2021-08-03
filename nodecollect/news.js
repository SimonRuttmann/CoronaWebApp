const newsapi = require('newsapi');
const db = require('./db');

module.exports = { getCoronaNewsToday };

async function getCoronaNewsToday(mqttClient) {
    var data = [];

    const news = new newsapi('a0f7ef5d4910438bb69866556aa7caa6');

    var date = new Date(Date.now());
    var today = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate();

    var response = await news.v2.everything({
        q: '+corona +baden +württemberg -bw -ostalb -ostalbkreis',
        from: today,
        to: today,
        language: 'de',
        sortBy: 'popularity'
    });

    data = response.articles;

    if (data.length == 0) return undefined;

    var save = {};
    save.date = today;
    save.articles = data;

    var found = await db.find({ date: today }, "newsCoronaBW");

    if (found.length != 0) {
        db.deleteMany({ date: today }, "newsCoronaBW");
    }

    db.insertOne(save, "newsCoronaBW");
    mqttClient.publish("refresh", "newsCoronaBW");

    return data;
}