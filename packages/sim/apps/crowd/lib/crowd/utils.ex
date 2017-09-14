defmodule Crowd.Utils do
  @moduledoc """
  Utility collection

  EXAMPLE

  iex> c1 = Crowd.Components.MoveableComponent.new 4
  %ECS.Component{data: %{v: 4}, type: :moveable}
  iex> c2 = Crowd.Components.PositionComponent.new 1, 2, 3
  %ECS.Component{data: %{x: 1, y: 2, z: 3}, type: :placeable}
  iex> comps = [c1, c2]
  [%ECS.Component{data: %{v: 4}, type: :moveable},
  %ECS.Component{data: %{x: 1, y: 2, z: 3}, type: :placeable}]
  iex> Crowd.Utils.create_mask comps
  10
  """

  use Bitwise
  alias Crowd.Components.ComponentTypes

  @doc """
  Simple utility to convert a set of components to a component mask.
  Requires that all components have a type element that refers to a
  value in the ComponentTypes.
  """
  @spec create_mask(list(ECS.Component.ecs_component)) :: integer
  def create_mask(components) do
    Map.keys(components)
    |> Enum.reduce(0, fn (key, acc) ->
      acc ||| ComponentTypes.encode(key)
    end)
    # Enum.reduce(components, 0, fn (comp, acc) ->
    #   acc ||| ComponentTypes.encode(comp.type)
    # end)
  end
end