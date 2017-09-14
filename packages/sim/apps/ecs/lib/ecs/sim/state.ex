defmodule ECS.Sim.State do
  @typedoc """
  An ECS Component consists of a component type and data.
  """
  @type t :: %ECS.Sim.State{
    systems: list(),
    startTime: DateTime,
    endTime: DateTime,
    curTime: DateTime,
    dt: float,
    running: boolean
  }

  defstruct systems: [], startTime: nil, endTime: nil, curTime: nil, dt: 0.01, running: false
end