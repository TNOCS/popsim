defmodule Crowd.Systems.MessengerSystem do
  @moduledoc """
  Processes all entities that have a position, and outputs their position to the Kafka bus.
  """
  require Logger

  @behaviour ECS.System

  alias Crowd.Components.PositionComponent
  alias Crowd.Components.MoveableComponent

  @mask Crowd.Utils.create_mask( PositionComponent.new )
  @position PositionComponent.name
  @moveable MoveableComponent.name
  @time_between_messages_in_seconds 600

  def init(_time, _dt) do
    Agent.start_link(fn -> %{ lastMsg: DateTime.utc_now } end, name: __MODULE__)

    # Send an empty message, ignoring errors, so the channel is created and you don't loose the first message.
    case Kaffe.Producer.produce_sync("crowdChannel", []) do
      # {:error, reason} -> IO.puts reason
      _ -> :ok
    end
    case Kaffe.Producer.produce_sync("timeChannel", []) do
      {:error, reason} -> IO.puts " ERROR creating timeChannel: #{reason}"
      _ -> :ok
    end
  end

  def update(time, _dt) do
    send? = Agent.get_and_update(__MODULE__, fn state ->
      dif = DateTime.diff(time, state.lastMsg) # Difference in seconds
      if ( dif > @time_between_messages_in_seconds) do
        newState = %{ state | lastMsg: time }
        { true, newState }
      else
        { false, state }
      end
    end)
    if (send?) do
      IO.puts "Sending positions at #{time}, mask: #{@mask}"
      Task.start fn ->
        send_time(time)
        send_entities(ECS.Registry.get(@mask), time)
      end
    end
  end

  defp send_entities(entities, time) do
    msg = entities
    |> Enum.reduce([%{ time: DateTime.to_iso8601(time)}], fn({ entity, _mask }, acc) -> [extract_properties_to_send(entity) | acc] end)
    |> convert_to_json
    # IO.inspect msg
    Logger.info fn -> msg end
    Kaffe.Producer.produce_sync("crowdChannel", msg)
  end

  defp send_time(time) do
    IO.inspect time
    IO.inspect DateTime.to_iso8601(time)
    case Kaffe.Producer.produce_sync("timeChannel", "time", DateTime.to_iso8601(time)) do
      :ok -> IO.puts "Send time successfully"
      { :error, reason } -> IO.puts "Error sending time message: #{reason}"
    end
  end

  defp extract_properties_to_send(entity) do
    Agent.get(entity.pid, fn s ->
      %{
        entity.id => %{
          id: entity.id,
          x: truncate(s[@position].x),
          y: truncate(s[@position].y),
          v: truncate(s[@moveable].speed),
          vx: truncate(get_in(s, [@moveable, :vx])),
          vy: truncate(get_in(s, [@moveable, :vy]))
        }
      }
    end)
  end

  defp truncate(x) do
    case x do
      x when is_number(x) -> round(1000 * x) / 1000
      _ -> nil
    end
  end

  defp convert_to_json(entities) do
    IO.puts "Converting to JSON"
    Poison.encode!(entities)
  end
end