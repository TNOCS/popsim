I'm new to Elixir, but keen to get my hands dirty, so I am looking for some guidance on developing an open source crowd simulator. The idea is to simulate > 100_000 of people walking around the city, doing activities like walking to work, going to lunch with colleages, or a parent bringing his kids to school.

What I have so far is the following (using a random map region in The Netherlands):

- A list of all buildings (homes, shops, offices, etc.)
- Census data
- A list of households
- A list of persons (members of these households), each with an agenda with activities (like bringing your kid to school)
- A graph of pedestrian routes (based on Open Street Map data)

All of the above is developed as separate microservices (nodejs) connected by Apache Kafka (see https://github.com/tnocs/popsim). As I need to simulate many people, I thought that Elixir processes would be a better way to go than OOP in Nodejs. So the actual crowd simulator in Elixir would entail:

- A Kafka connector to get the list of persons, their activities, and the routing graph
- An A* routing service (maybe use a supervisor with a pool of navigation services that do the actual computation)
- A simulation clock service that manages the actual simulation time (listens to messages on the Kafka bus to start/stop)
- A simulation engine to update the position of the persons (and to distribute it to the bus)

Is this the right approach, and if so, do you have any suggestions with respect to related projects or libraries I should look at? And any ideas how I could leverage multiple nodes (distribute over multiple PCs)?

Any help is appreciated!