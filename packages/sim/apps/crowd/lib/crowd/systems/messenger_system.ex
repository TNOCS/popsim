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

  def init(_time, _dt) do
    case Kaffe.Producer.produce_sync("crowdChannel", []) do
      {:error, reason} -> IO.puts reason
      _ -> :ok
    end
  end

  def update(time, _dt) do
    IO.puts "Sending positions at #{time}, mask: #{@mask}"
    Task.start fn -> send_entities(ECS.Registry.get(@mask)) end
    # send_entities(ECS.Registry.get(@mask))
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
        id: entity.id,
        x: s[@position].x,
        y: s[@position].y,
        v: s[@moveable].speed
       }
    end)
  end

  defp convert_to_json(entities) do
    IO.puts "Converting to JSON"
    Poison.encode!(entities)
  end
end