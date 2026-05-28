FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./mvnw -B -DskipTests clean package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx128m", "-Xms32m", "-Xss256k", "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=64m", "-XX:ReservedCodeCacheSize=32m", "-jar", "app.jar"]
