FROM node

COPY db.js /node
COPY districts.js /node
COPY index.js /node
COPY mqtt.js /node
COPY raw.js /node
COPY vaccination.js /node

WORKDIR /node

CMD ["node", "index.js"]