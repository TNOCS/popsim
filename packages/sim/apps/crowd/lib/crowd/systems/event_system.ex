defmodule Crowd.Systems.EventSystem do
  @moduledoc """
  Processes an event file and reacts to the defined events.
  """
  require Logger

  @behaviour ECS.System

  alias Utils.CoordinateTransformations, as: Transform
  alias Crowd.Components.PositionComponent
  alias Crowd.Components.MoveableComponent
  alias Crowd.Components.AgendaComponent
  alias Crowd.Services.ActivitiesRegistry

  @mask Crowd.Utils.create_mask( MoveableComponent.new )
  @position PositionComponent.name
  @moveable MoveableComponent.name
  @agenda AgendaComponent.name
  @event_file "events.json"

  def init(_time, _dt) do
    IO.puts "###########################"
    IO.puts ">> Starting event system..."
    IO.puts "###########################"
    Agent.start_link(fn -> create_state() end, name: __MODULE__)
    Logger.info fn -> "EventSystem: started." end
  end

  def update(time, _dt) do
    # IO.puts "###########################"
    # IO.puts ">> Updating event system..."
    # IO.puts "###########################"
    Agent.update(__MODULE__, fn state ->
      { new_active_events, inactive_events } = Enum.split_with(state.inactive_events, fn f ->
        # IO.inspect f
        t = f["properties"]["start"]
        DateTime.diff(time, t) > 0
      end)
      cur_active_events = new_active_events ++ state.active_events
      cur_active_events |> Enum.each(&(activate_event(&1)))
      { old_events, active_events } = Enum.split_with(cur_active_events, fn f ->
        # IO.inspect f
        t = f["properties"]["end"]
        DateTime.diff(time, t) > 0
      end)
      old_events |> Enum.each(&(deactivate_event(&1)))
      new_state = %{
        inactive_events: inactive_events,
        active_events: active_events,
        old_events: old_events ++ state.old_events
      }
      # IO.inspect new_state
      new_state
    end)
  end

  defp activate_event(f) do
    type = f["properties"]["type"]
    # IO.puts "Activating '#{type}' event: #{f["properties"]["name"]}"
    Logger.info fn -> "Activating '#{type}' event: #{f["properties"]["name"]}" end
    case type do
      "attract" -> attract_event(f)
      "repel" -> repel_event(f)
    end
  end

  defp deactivate_event(f) do
    IO.puts "Deactivating event: #{f["properties"]["name"]}"
  end

  defp attract_event(f) do
    x = f["properties"].x;
    y = f["properties"].y;
    r = f["properties"]["radius"]
    max_r = round(0.1 * r)
    id = f["properties"]["id"]
    name = f["properties"]["name"]
    start = f["properties"]["start"]
    endTime = f["properties"]["end"]
    deg2rad = 2 * :math.pi / 360

    entities = get_entities_near_location(f)
    # IO.puts "Attracting #{Enum.count(entities)} entities"
    entities
    |> Enum.each(fn { es, _mask } ->
      dr = Enum.random(0..max_r)
      fi = Enum.random(0..360) * deg2rad
      Agent.update(es.pid, fn entity ->
        activity_id = "#{id}_#{ECS.Utils.random_string()}"
        activity = %{
          group: [es.id],
          location: %{
            locType: 0,
            relType: 0,
            x: x + dr * :math.sin(fi),
            y: y + dr * :math.cos(fi)
          },
          name: name,
          speed: 1,
          start: start,
          end: endTime,
          type: 1
        }
        ActivitiesRegistry.insert(activity_id, activity)
        update_in(entity, [@agenda, :activities], &([activity_id | &1]))
      end)
    end)
  end

  defp repel_event(f) do
    # IO.puts "Repel"
    x = f["properties"].x;
    y = f["properties"].y;
    r = f["properties"]["radius"]
    max_r = round(1.2 * r)
    id = f["properties"]["id"]
    name = f["properties"]["name"]
    start = f["properties"]["start"]
    endTime = f["properties"]["end"]
    deg2rad = 2 * :math.pi / 360

    get_entities_near_location(f)
    |> Enum.each(fn { es, _mask } ->
      dr = Enum.random(r..max_r)
      fi = Enum.random(0..360) * deg2rad
      Agent.update(es.pid, fn entity ->
        activity_id = "#{id}_#{ECS.Utils.random_string()}"
        activity = %{
          group: [es.id],
          location: %{
            locType: 0,
            relType: 0,
            x: x + dr * :math.sin(fi),
            y: y + dr * :math.cos(fi)
          },
          name: name,
          speed: 1,
          start: start,
          end: endTime,
          type: 1
        }
        ActivitiesRegistry.insert(activity_id, activity)
        update_in(entity, [@agenda, :activities], &([activity_id | &1]))
      end)
    end)
  end

  defp get_entities_near_location(f) do
    filter = is_entity_new_and_near_location?(f["properties"].x, f["properties"].y, f["properties"]["radius"], f["properties"]["id"])
    ECS.Registry.get(@mask, filter)
  end

  defp is_entity_new_and_near_location?(x, y, r, id) do
    r_square = r * r
    Curry.curry(fn es ->
      Agent.get(es.pid, fn entity ->
        already_seen = entity[@agenda].activities
        |> Enum.any?(fn a -> String.starts_with?(a, id) end)
        if already_seen do
          false
        else
          dx = entity[@position].x - x
          dy = entity[@position].y - y
          dx * dx + dy * dy <= r_square
        end
      end)
    end)
  end

  defp create_state() do
    Logger.info fn -> "EventSystem: Creating initial state..." end
    {:ok, events} = load_events(@event_file)
    inactive_events = events
      |> Enum.map(fn ev ->
        IO.inspect ev["properties"]["name"]
        ev = update_in(ev, ["properties", "start"], &(parse_time(&1)))
        ev = update_in(ev, ["properties", "end"], &(parse_time(&1)))
        [lon, lat] = get_in(ev, ["geometry", "coordinates"])
        xy = Transform.wgs84_to_rd(lon, lat)
        ev = put_in(ev, ["properties", :x], xy.x )
        ev = put_in(ev, ["properties", :y], xy.y )
        ev
      end)
    %{ inactive_events: inactive_events, active_events: [], old_events: [] }
  end

  defp load_events(filename) do
    with {:ok, body} <- File.read(filename),
         {:ok, json} <- Poison.decode(body), do: {:ok, json}
  end

  defp parse_time(time_string) do
    { :ok, d, _ } = DateTime.from_iso8601 time_string
    d
  end

  # def update(time, _dt) do
  #   send? = Agent.get_and_update(__MODULE__, fn state ->
  #     now = DateTime.utc_now;
  #     dif = DateTime.diff(now, state.lastMsg) # Difference in seconds
  #     if ( dif > @time_between_messages_in_seconds) do
  #       newState = %{ state | lastMsg: now }
  #       { true, newState }
  #     else
  #       { false, state }
  #     end
  #   end)
  #   if (send?) do
  #     IO.puts "Sending positions at #{time}, mask: #{@mask}"
  #     Task.start fn -> send_entities(ECS.Registry.get(@mask)) end
  #   end
  # end

  # def send_entities(entities) do
  #   msg = entities
  #   |> Enum.reduce([], fn({ entity, _mask }, acc) -> [extract_properties_to_send(entity) | acc] end)
  #   |> convert_to_json
  #   # IO.inspect msg
  #   Kaffe.Producer.produce_sync("crowdChannel", msg)
  # end

  # defp extract_properties_to_send(entity) do
  #   Agent.get(entity.pid, fn s ->
  #     %{
  #       entity.id => %{
  #         x: s[@position].x,
  #         y: s[@position].y,
  #         v: s[@moveable].speed
  #       }
  #     }
  #   end)
  # end

  # defp convert_to_json(entities) do
  #   IO.puts "Converting to JSON"
  #   Poison.encode!(entities)
  # end
end