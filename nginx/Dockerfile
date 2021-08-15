FROM nginx

RUN rm /etc/nginx/conf.d/default.conf

COPY ./nodeexpressapi/public/ /nginx/html/public/
COPY ./nginx/default.conf /etc/nginx/conf.d/

EXPOSE 80
EXPOSE 8080