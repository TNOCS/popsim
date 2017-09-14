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