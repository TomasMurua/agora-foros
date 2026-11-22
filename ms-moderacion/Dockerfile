# Imagen del microservicio ms-moderacion.
# La etapa de compilacion corre en la arquitectura del equipo que construye (BUILDPLATFORM)
# y la imagen final puede ser linux/amd64 para la nube aunque se construya en un Mac arm64.
FROM --platform=$BUILDPLATFORM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S agora && adduser -S agora -G agora
COPY --from=build /app/target/ms-moderacion.jar app.jar
USER agora
EXPOSE 8083
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k"
HEALTHCHECK --interval=20s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:8083/actuator/health/liveness || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
