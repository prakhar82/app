# syntax=docker/dockerfile:1
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml ./
COPY common-lib ./common-lib
COPY order-service ./order-service
RUN mvn -q -N -f pom.xml install
RUN mvn -q -f common-lib/pom.xml install -DskipTests
RUN mvn -q -f order-service/pom.xml package spring-boot:repackage -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/order-service/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
