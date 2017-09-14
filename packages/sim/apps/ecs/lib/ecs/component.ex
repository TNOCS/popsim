defmodule ECS.Component do
  @moduledoc """
  A base for creating new Components.
  """

  # @typedoc """
  #   An ECS Component consists of a component type and data.
  # """
  # @type t :: %ECS.Component{
  #   type: String.t,
  #   data: map()
  # }

  # defstruct [:type, :data]

  @typedoc """
  An ECS Component type consists of an atom as key and a map as value.
  """
  @type ecs_component :: %{required(atom()) => map()}

  @callback new(map()) :: ecs_component

  @doc """
  Return the name of the component
  """
  @callback name() :: String.t

end