const newsapi = require('newsapi');
const db = require('./db');

module.exports = { getCoronaNewsToday };

var message=
{
    "info":"",
    "data":[]
}

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

    date.setDate(date.getDate() - 3);
    var ttlDate = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate();

    var removeNews = [];
    var dbNews = await db.find({}, "newsCoronaBW");
    for (var i = 0; i < dbNews.length; i++) {
        if (dbNews[i].date == today || new Date(dbNews[i].date) <= new Date(ttlDate)) {
            removeNews.push(dbNews[i]);
        }
    }

    for (var i = 0; i < removeNews.length; i++) {
        await db.deleteOne(removeNews[i], "newsCoronaBW");
    }

    await db.insertOne(save, "newsCoronaBW");
    message.info = "newNews4Today";
    message.data= [];
    message.data.push(save);
    mqttClient.publish("news", JSON.stringify(message));

    return data;
}