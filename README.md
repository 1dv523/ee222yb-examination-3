# ee222yb-examination-3
Examination assignment 3 for Eric Enoksson, PT2017

url: cscloud689.lnu.se

# Describe what you have done to make your application secure, both in code and when configuring your application server.
- The reversed proxy is runnning via the https protocol with a signed certificate from Let's encrypt authority via certbot.
- The login to github is done via an access token. Unlike with a username/password login, this makes it possible to limit account access.
- When creating the web hook, a secret is supplied. Using this as a hash key, github and my web server calculates a hash that must
conform for my web server to take action. This to make sure the request originates from github.
- (helmet removes certain headers that could provide insight to the server application)


# Describe the following parts, how you are using them, and what their purpose is in your solution:
- Reversed proxy -
 The reversed proxy server deals with incoming requests on 443 and redirects traffic to my web server. It also accepts requests on port
 80 by sending a 301 redirect to the client to make sure the connection is encrypted.
- Process manager -
 The process manager runs the web server application in the background, making the server console available. 
 If the application crashes, it will restart it.
 In addition, it provides other functionality like e.g. real time monitoring showing the amount of ram and cpu used by the application.
- TLS certificates -
 They are newer version protocol of SSL and is a part of https (http + tls). The certificate validates the identification of my domain through a certificate authority trusted by common client web browsers.
- Environment variables -
 These are variables stored in an external local file that the application loads when started.
 It contains sensitive data and local settings like e.g. access tokens that never leaves the local machine. For instance, data you wouldn't want to place on a version control system like github.


# What differs in your application when running it in development from running it in production?
The logging is kept to a minimum and error messages are less verbose.

(The production server is set to restart when a commit is pushed to it. Node does not install developer dependencies)


# Which extra modules did you use in the assignment? Motivate the use of them, and how you have to make sure that they are secure enough for production.
- octonode - to simplify github api calls
- dotenv - to simplify parsing of the .env file
- socket.io - to help me deal with the websocket connection
- crypto, bodyparser - used to calculate the web hook hash
- compression - middleware used by express to compress response bodies

Most of them were recommended by John, plus no known vulnerabilites are listed when doing npm audit

# Have you implemented any extra features (see below) that could motivate a higher grade of this assignment? If so, describe them.
The only extra stuff I've done is using the authorized ssl certificate instead of the self signed, and the reversed proxy is running on http 2 instead of http 1.1.
