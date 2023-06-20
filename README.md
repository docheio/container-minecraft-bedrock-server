Minecraft Bedrock Server

```bash
# This command is going to update or install and run the latest minecraft bedrock server.
yarn all
```

To make data persistent, a folder or volume must be mounted to `/root/mount`.

```bash
# This will send a command to minecraft bedrock server.
docker exec -it mcbe curl -s -X POST -H "Content-Type: application/json" -d {"command": "stop"} 127.0.0.1:8080
```
