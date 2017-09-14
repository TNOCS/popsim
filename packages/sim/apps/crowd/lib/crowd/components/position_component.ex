defmodule Crowd.Components.PositionComponent do
  @moduledoc """
  Component that contains the variables to make an entity position in the world.
  """
  @behaviour ECS.Component

  @component_type :position

  @doc """
  Create a new position component.
  """
  @spec new(%{ x: float, y: float, z: float, inside?: boolean }) :: ECS.Component.ecs_component
  def new( %{x: x, y: y, z: z, inside?: inside? } \\ %{ x: 0, y: 0, z: 0, inside?: true }) do
    %{ @component_type => %{ x: x, y: y, z: z, inside?: inside? } }
  end

  def name, do: @component_type

end