defmodule ECS.Sim do
  @moduledoc """
  A supervisor to start the required services and the main simulation engine.
  """
  use Supervisor

  @name { :global, __MODULE__ }

  def start_link(state \\ []) do
    Supervisor.start_link(__MODULE__, state, name: @name)
  end

  def init(state) do
    children = [
      worker(ECS.Registry, []),
      worker(ECS.Sim.Engine, [state]),
      worker(Messenger, [])
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end