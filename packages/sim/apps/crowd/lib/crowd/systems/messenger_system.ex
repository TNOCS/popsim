defmodule Crowd.Systems.MessengerSystem do
  @moduledoc """
  Processes all entities that have a position, and outputs their position to the Kafka bus.
  """
  @behaviour ECS.System

  alias Crowd.Components.PositionComponent
  alias Crowd.Components.MoveableComponent

  @mask Crowd.Utils.create_mask( PositionComponent.new )
  @position PositionComponent.name
  @moveable MoveableComponent.name
  @time_between_messages_in_seconds 5

  def init(_time, _dt) do
    Agent.start_link(fn -> %{ lastMsg: DateTime.utc_now } end, name: __MODULE__)

    # Send an empty message, ignoring errors, so the channel is created and you don't loose the first message.
    case Kaffe.Producer.produce_sync("crowdChannel", []) do
      # {:error, reason} -> IO.puts reason
      _ -> :ok
    end
  end

  def update(time, _dt) do
    send? = Agent.get_and_update(__MODULE__, fn state ->
      now = DateTime.utc_now;
      dif = DateTime.diff(now, state.lastMsg) # Difference in seconds
      if ( dif > @time_between_messages_in_seconds) do
        newState = %{ state | lastMsg: now }
        { true, newState }
      else
        { false, state }
      end
    end)
    if (send?) do
      IO.puts "Sending positions at #{time}, mask: #{@mask}"
      Task.start fn -> send_entities(ECS.Registry.get(@mask)) end
    end
  end

  def send_entities(entities) do
    msg = entities
    |> Enum.reduce([], fn({ entity, _mask }, acc) -> [extract_properties_to_send(entity) | acc] end)
    |> convert_to_json
    # IO.inspect msg
    Kaffe.Producer.produce_sync("crowdChannel", msg)
  end

  defp extract_properties_to_send(entity) do
    Agent.get(entity.pid, fn s ->
      %{
        entity.id => %{
          x: s[@position].x,
          y: s[@position].y,
          v: s[@moveable].speed
        }
      }
    end)
  end

  defp convert_to_json(entities) do
    IO.puts "Converting to JSON"
    Poison.encode!(entities)
  end
end