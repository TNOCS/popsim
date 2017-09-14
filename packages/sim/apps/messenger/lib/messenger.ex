defmodule Messenger do
  use Supervisor

  @moduledoc """
    Messenger is a simple Kafka client (based on Kaffe) that listens
    to some preconfigured channels in config/config.exs. Each channel
    has its own callback function to process the data.

    The JSON data that it receives is used to create ECS entities.
  """

  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  def init(_) do
    children = [
      worker(Kaffe.Consumer, [])
    ]

    supervise(children, [strategy: :one_for_one])
  end
end
