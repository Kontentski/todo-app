FROM golang:latest AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -tags netgo -ldflags "-extldflags '-static'" -o /bin/todoapp ./cmd/todoapp

FROM alpine:latest

COPY --from=builder /bin/todoapp /bin/todoapp
COPY index.html style.css app.js delete.svg login.svg /www/
EXPOSE 8080

CMD ["/bin/todoapp"]
