defmodule ECS.System do
  @moduledoc """
  Defines the behaviour of a System.
  """

  @doc """
  The init function is called once, before starting the game loop
  - current simulation time
  - dt {float}: the amount of time that has passed in milliseconds
  """
  @callback init(DateTime, float) :: nil

  @doc """
  The update function is called every main simulation loop
  - current simulation time
  - dt {float}: the amount of time that has passed in milliseconds
  """
  @callback update(DateTime, float) :: nil
end