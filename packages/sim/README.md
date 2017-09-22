# Sim

## Description

A very simple crowd simulator that makes entities move between between agenda locations. It uses Elixir and the Entity-Component-System approach.


## Installation

Run
```c
mix deps.get
```
To download all dependencies.

## Usage

Open simulation console:
```c
iex -S mix
```
Wait for the messages (persons, activities, simulation) to have loaded, and call
```elixir
ECS.Sim.Engine.init
ECS.Sim.Engine.step
```
to enter step mode, or
```elixir
ECS.Sim.Engine.start
```
to keep on running.


## TODO

### Phase 1

- Agenda:
  - DONE active?: boolean
  - DONE awake: DateTime, when we should start moving the person again.
  - maintain current or next activity?
- MovementSystem:
  - DONE check agenda and determine awake time
  - DONE ignore all persons that are asleep (sim time < awake time)
  - Update position based on path in MovementComponent
- ObserverSystem:
  - DONE Transmit new positions to Messenger
- DONE Create activity registry
- Messenger:
  - DONE Add activities to registry
  - DONE Set speed based on information from person - speed is derived from activity
  - DONE Receive start and end time and set in ECS.Sim.Engine
  - DONE Send person positions %Crowd.Person{ id, x, y, inside }

#### DONE Phase 1
- MovementComponent
  - Add path, a list of x, y positions that the person has to follow
- PositionComponent
  - inside?: boolean, whether we are at one of the locations in the Agenda.

### Phase 2

- Create Health component:
  - health = 0..100,
  - initial = Math.min(100, (1.25 - Math.random() / 2) * (100 - Math.max(0, age - 40)))
- Transmit the walking speed in a person message, so we can use the same value here for the movement component
- Messenger:
  - Receive node graph and send to PathPlanner
- PathPlanner: A*
  - Use poolboy to start a couple of planners
  - Convert original map to navigation map: add edges between all nearby nodes, with a large penalty, so we can cross roads
  - Receive start and end positions in x, y, and compute a path of nodes (x, y positions)
- MovementSystem
  - Uses PathPlanner


  ## Gedragsregels

- Mensen nemen de weg terug die ze gekomen zijn
- It is recognized that every person involved in an emergency will feel some form of stress regardless of their age, gender, past experience, training or cultural background.
- The performance of the person in dealing with a stressful situation will depend on the task demands, the environmental conditions and the subject himself or herself
- In order to make a decision the person will process information, perceived in the environment or drawn from past experience
- Decision-making during an emergency is different from day-to-day decision-making for three main reasons. First, there is much more at stake in emergency decisions - often the survival of the person and of the people he or she values the most is at play. Second, the amount of time available is limited to make a decision before crucial options are lost. Third, the information on which to base a decision is ambiguous, incomplete and unusual, further it is usually impossible to look for more appropriate information due to the lack of both time and means to get information
- group cohesiveness, a striving for unanimity, pressures for conformity in reaching a decision, self-censoring of different ideas, guarding oneself against information that conflicts with the group’s desired solution and illusions and misperceptions of invulnerability.
- research shows that 9.9 times out of 10, people don’t turn into crazed individuals, but behave quite rationally. They tend to help each other too.
- elements that have to be considered at events such as drug and alcohol consumption
- Social media could potentially have a bigger effect on the crowd than alcohol and drugs combined. A disturbing social post can travel at the speed of light and cause mass disruption
- concept of commitment. Occupants who have paid good money to watch a trendy movie are not prepared to leave while they are engrossed in the story.
- In a museum or a department store, most occupants play the role of visitors and as such, they expect to be taken care of. If the fire alarm signal is activated, there are social interactions taking place: people will be looking at what others are doing. Therefore, if others are not paying attention to the fire alarm signal, occupants become reluctant to take any action that would make them appear out of place or over-reacting to an insignificant situation. The role of visitors is usually to conform to the general behaviour of others.
- Furthermore, visitors feel that it is their role to wait for instructions, even if they have recognized the signal as a fire alarm signal. They expect that someone will tell them what to do if something serious is really happening.
- staff response had the most determinant effect on the occupant time to start their evacuation.
- after fire ignition and detection, occupants will spend several seconds, if not minutes, in non-evacuation actions. Time will be spent investigating and finding information to interpret the perceived cue. Once occupants are pretty 6 sure that this is indeed a fire or an emergency, they are likely to engage in behaviour such as finding children or valuables before deciding to evacuate the building.
