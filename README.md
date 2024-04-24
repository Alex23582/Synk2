Synk is a webapp to watch videos synchronously over the internet.
Synk is usable, but not finished. Other versions of synk are in the workings. If you want to try it, you'd have to host it yourself since i'm not too familiar with data regulation laws.
### Scalability
I created synk with an unnecessary scaling potential utilizing containerization and horizontal scaling to practice and learn this topic. The backend is designed to work stateless and therefore stores all state in the database and communicates with other backend deployments and the teamspeakworker over RabbitMQ. Minio is an alternative to AWS S3-Buckets. Minio is being used to store the profile pictures of the users, since the backend is stateless.
Synk is seperated into three parts. The frontend: "synk", the backend "synkserver" and the teamspeakworker. Each of them has their own Dockerfile, but you can also run them without docker.
I deployed synk on my dedicated server with kubernetes using the kubernetes.yml i created. It's should be really scalable in theory. A possible limiter is the use of only one RabbitMQ instance which could cause congestion.
### Frontend
The Frontend is made using NextJS7. For global state management i used the react context api.
### Backend
The Backend is a nodejs-app using expressjs and socket.io. It's connecting to a Postgres server, a Minio server and a RabbitMQ server. Designed to be stateless for horizontal scaling.
### Teamspeakworker
The teamspeakworker is optional. Synk allows logins with teamspeak³. It matches the IP of the user on the website with the IPs of users on a given teamspeak server. If there is a match, the teamspeakworker sends a message to the teamspeak user. The website displays a verification code on the website that the user has to send to the teamspeakworker client. If the code matches, the teamspeakworker automatically logs the user in.
The teamspeakworker is not designed to be stateless and scalable, since multiple running instances of the teamspeakworker would use too much teamspeak-slots.
### Screenshots
