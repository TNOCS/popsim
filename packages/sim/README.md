# Sim

**TODO: Add description**


## TODO

### Phase 1

- Agenda:
  - active?: boolean
  - awake: DateTime, when we should start moving the person again.
  - maintain current or next activity?
- MovementSystem:
  - check agenda and determine awake time
  - ignore all persons that are asleep (sim time < awake time)
  - Update position based on path in MovementComponent
- ObserverSystem:
  - Transmit new positions to Messenger
- Create activity registry
- Messenger:
  - Add activities to registry
  - Set speed based on information from person - speed is derived from activity
  - Receive start and end time and set in ECS.Sim.Engine
  - Send person positions %Crowd.Person{ id, x, y, inside }

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