FROM node

COPY ./nodeexpressapi/ /node/
COPY ./general/ /node/

WORKDIR /node

#Needed
#sudo apt install npm
#sudo npm install mongoose
#

EXPOSE 6969
CMD ["node", "server.js"]