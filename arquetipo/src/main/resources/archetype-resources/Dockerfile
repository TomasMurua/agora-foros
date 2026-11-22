#set( $symbol_pound = '#' )
#set( $symbol_dollar = '$' )
#set( $symbol_escape = '\' )
${symbol_pound} Imagen del microservicio ${artifactId}.
${symbol_pound} La etapa de compilacion corre en la arquitectura del equipo que construye (BUILDPLATFORM)
${symbol_pound} y la imagen final puede ser linux/amd64 para la nube aunque se construya en un Mac arm64.
FROM --platform=${symbol_dollar}BUILDPLATFORM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S agora && adduser -S agora -G agora
COPY --from=build /app/target/${artifactId}.jar app.jar
USER agora
EXPOSE ${puerto}
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k"
HEALTHCHECK --interval=20s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:${puerto}/actuator/health/liveness || exit 1
ENTRYPOINT ["sh", "-c", "exec java ${symbol_dollar}JAVA_OPTS -jar app.jar"]
