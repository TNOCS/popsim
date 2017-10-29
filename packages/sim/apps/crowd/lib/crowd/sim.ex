defmodule Crowd.Sim do
  @moduledoc """
  A supervisor to start the required services and the main simulation engine.
  """
  use Application
  @name { :global, __MODULE__ }

  # use Supervisor

  # def start_link(state \\ []) do
  #   Supervisor.start_link(__MODULE__, state, name: @name)
  # end

  # def init(_state) do
  #   children = [
  #     supervisor(ECS.Sim, [[Crowd.Systems.MovementSystem]])
  #   ]

  #   Supervisor.init(children, strategy: :one_for_one)
  # end

  def start(_type, _args) do
    children = [
      { ECS.Sim, [
          Crowd.Systems.EventSystem,
          Crowd.Systems.WakeUpSystem,
          Crowd.Systems.MovementSystem,
          Crowd.Systems.MessengerSystem
        ]
      },
      { Crowd.Services.ActivitiesRegistry, [] }
    ]

    opts = [strategy: :one_for_one, name: @name]
    Supervisor.start_link(children, opts)
  end
end