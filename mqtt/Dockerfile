FROM eclipse-mosquitto

COPY mosquitto.conf /mosquitto

EXPOSE 1884
EXPOSE 1883

CMD ["mosquitto", "-c", "/mosquitto/mosquitto.conf"]