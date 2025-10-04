# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY main.go ./

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o /spinwheel-server

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Copy binary
COPY --from=builder /spinwheel-server /app/spinwheel-server

# Expose port
EXPOSE 8080

# Run
CMD ["/app/spinwheel-server"]
