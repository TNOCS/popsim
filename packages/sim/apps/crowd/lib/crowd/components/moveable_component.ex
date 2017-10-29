defmodule Crowd.Components.MoveableComponent do
  @moduledoc """
  Component that contains the variables to make an entity move.
  """

  @behaviour ECS.Component

  @component_type :moveable

  # alias ECS.Component

  @doc """
  Create a new Moveable component.
  - speed: float
  - vx: float
  - vy: float
  - path: [{ x: float, y: float}]
  """
  @spec new(%{ speed: float, vx: float, vy: float, path: list({ float, float })}) :: ECS.Component.ecs_component
  def new(data \\ %{ speed: 0, vx: 0, vy: 0, path: [] }) do
    %{ @component_type => data }
    # %ECS.Component{ type: @component_type, data: %{ v: speed  } }
  end

  def name, do: @component_type

end