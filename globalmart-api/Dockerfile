# Stage 1: Build the application
# Sử dụng đúng Java 17 như cấu hình pom.xml của bạn
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy Maven wrapper and pom.xml first to cache dependencies
COPY mvnw ./
COPY .mvn ./.mvn
COPY pom.xml ./

# Make mvnw executable
RUN chmod +x mvnw

# Download dependencies (this layer will be cached)
RUN ./mvnw dependency:go-offline -B

# Copy the rest of the project
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Stage 2: Run the application
# Sử dụng JRE 17 bản Alpine để container chạy siêu nhẹ và an toàn
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the default Spring Boot port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]