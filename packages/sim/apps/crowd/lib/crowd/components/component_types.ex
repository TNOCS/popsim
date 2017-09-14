defmodule Crowd.Components.ComponentTypes do
  @moduledoc """
  This contains all common component type names as a struct, so you can use it to create a component mask.
  With the mask in place, systems know which entities have the right set of components to do their magic.

  See [michal's solution](https://elixirforum.com/t/shared-module-constants/2799/10).
  """

  values = [
    agenda: 1,
    moveable: 2,
    physical: 4,
    position: 8,
    health: 16
  ]
  for {key, value} <- values do
    @doc """
    Convert key to an integer.
    """
    def encode(unquote(key)),   do: unquote(value)
    @doc """
    Convert integer to a key.
    """
    def decode(unquote(value)), do: unquote(key)
  end

end