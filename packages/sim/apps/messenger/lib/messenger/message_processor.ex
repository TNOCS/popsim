defmodule Messenger.MessageProcessor do
  alias Utils.CoordinateTransformations, as: Transform
  alias Crowd.Components.MoveableComponent
  alias Crowd.Components.PositionComponent
  alias Crowd.Components.PhysicalComponent
  alias Crowd.Components.AgendaComponent
  alias Crowd.Services.ActivitiesRegistry

  def handle_message(%{topic: "bagChannel", value: value}) do
    json = Poison.decode!(value)
    # IO.puts "#{key}: #{value}"
    # IO.puts "#{json}"
    # IO.puts "My topic is #{topic}"
    IO.puts "My topic is BAG"
    IO.puts "The type is #{json["type"]}"
    json["features"]
    |> Enum.each(fn (feature) -> process_bag_feature(feature) end)
    :ok # The handle_message function MUST return :ok
  end

  def handle_message(%{topic: "simChannel", value: value}) do
    json = Poison.decode!(value)
    IO.inspect json
    %{ "id" => id, "bbox" => _bbox, "end" => endTime, "start" => startTime } = json
    startTime = DateTime.from_unix!(startTime, :millisecond)
    endTime = DateTime.from_unix!(endTime, :millisecond)
    IO.inspect startTime
    IO.inspect endTime
    ECS.Sim.Engine.set(startTime: startTime, endTime: endTime, dt: 1)
    IO.puts "Ready processing simChannel message with id #{id}"
    :ok # The handle_message function MUST return :ok
  end

  def handle_message(%{topic: "activitiesChannel", value: value}) do
    Task.start(fn -> process_activities(value) end )
    :ok # The handle_message function MUST return :ok
  end

  def handle_message(%{topic: "personsChannel", value: value}) do
    Task.start(fn -> process_persons(value) end )
    :ok # The handle_message function MUST return :ok
  end

  def handle_message(message) do
    IO.puts "Unknown message received"
    IO.inspect message
    :ok # The handle_message function MUST return :ok
  end

  # PRIVATE METHODS

  defp process_activities(message) do
    json = Poison.decode!(message)
    IO.puts "Starting to process activitiesChannel message with id #{json["requestId"]}"
    startTime = DateTime.utc_now
    IO.puts DateTime.to_string startTime
    stream = Task.async_stream(json["activities"], fn {id, activity} -> ActivitiesRegistry.insert(id, parse_activity(activity)) end)
    count = Enum.reduce(stream, 0, fn {:ok, :ok}, acc -> acc + 1 end)
    # json["activities"]
    # |> Enum.each( fn {id, activity} -> ActivitiesRegistry.insert(id, parse_activity(activity)) end)
    endTime = DateTime.utc_now
    difTime = DateTime.diff endTime, startTime, :millisecond
    IO.puts "Time to process all activities: #{difTime} msec"
    IO.puts "Ready processing activitiesChannel message with id #{json["requestId"]} and #{count} activities."
  end

  defp process_persons(message) do
    json = Poison.decode!(message)
    IO.puts "Starting to process personsChannel message with id #{json["requestId"]}"
    bbox = json["bbox"]
    IO.inspect bbox
    json["persons"]
    |> Enum.each(fn (person) -> process_person(person) end)
    IO.puts "Ready processing personsChannel message with id #{json["requestId"]}"
  end

  defp process_person({_id, data}) do
    # IO.inspect data
    %{
      # "age" => age,
      # "gender" => gender,
      # "isLocal"  => local,
      "agenda" => activities,
      "locations" => locations,
      "roles" => roles
      } = data

    if activities == [] do
      nil   # If the person has nothing to do, ignore him or her.
    else
      # IO.puts "Person: #{id}, age #{age}, gender #{gender}"
      # IO.inspect activities
      # IO.inspect locations
      # IO.inspect roles

      # roleList = roles
      # |> Enum.map(fn (%{"location" => location, "role" => role}) -> %{ loc: location, role: role } end)
      # |> Enum.into([])

      locList = locations
      |> Enum.map(fn (%{ "geo" => geo, "locType" => locType, "relType" => relType}) ->
          %{ "coordinates" => coordinates } = geo
          xy = Transform.wgs84_to_rd(Enum.at(coordinates, 0), Enum.at(coordinates, 1))
          %{ xy: xy, locType: locType, relType: relType }
          # IO.inspect geo
          # IO.inspect rd
          # IO.inspect locType
          # IO.inspect relType
        end)
      |> Enum.into([])

      [home | _] = locList

      # IO.puts "HOME:"
      # IO.inspect home
      components = MoveableComponent.new( %{ speed: 5000 / 3600 * (1 + (:rand.uniform - 0.5) / 3) })
      |> Map.merge(PositionComponent.new( %{ x: home.xy.x, y: home.xy.y, z: 0, inside?: true }))
      |> Map.merge(AgendaComponent.new( %{ activities: activities, roles: roles, locations: locations}))
      mask = Crowd.Utils.create_mask(components)
      ECS.Entity.new(components, mask)
    end
  end

  defp process_bag_feature(feature) do
    coordinates = feature["geometry"]["coordinates"] # |> Matrix.from_list
    [boundary | _] = coordinates
    # IO.puts "Boundary: "
    # IO.inspect boundary
    # [h | t] = boundary
    # IO.puts "Head: "
    # IO.inspect h
    # IO.puts "Tail: "
    # IO.inspect t

    # for a <- boundary do
    #   IO.inspect Enum.at(a, 0)
    #   IO.inspect Enum.at(a, 1)
    # end

    boundary
    |> Enum.map(fn x -> Transform.wgs84_to_rd(Enum.at(x, 0), Enum.at(x, 1)) end )
    |> Enum.into([])
    |> convert_building_to_components()
    |> ECS.Entity.new()
  end

  defp convert_building_to_components(rd) do
    [ PositionComponent.new(),
      PhysicalComponent.new( %{ type: :boundary, xy: rd })]
  end

  defp parse_activity(activity) do
    # IO.inspect activity
    %{"name" => name,
      "speed" => speed,
      "activity" => activityType,
      "location" => location,
      "start" => startTime,
      "end" => endTime,
      "group" => group} = activity
    # IO.inspect name
    %{"geo" => geo, "locType" => locType, "relType" => relType} = location
    %{"type" => "Point", "coordinates" => [lon, lat] } = geo
    # IO.puts "#{lon}, #{lat}"
    %{ x: x, y: y } = Transform.wgs84_to_rd(lon, lat)
    {:ok, simStart, _} = DateTime.from_iso8601(startTime)
    {:ok, simEnd, _} = DateTime.from_iso8601(endTime)
    # if speed < 5, do: IO.puts "Be at #{simStart} at #{x}, #{y} and rounded speed #{round(speed)}m/s"
    %{name: name,
      speed: speed,
      type: activityType,
      start: simStart,
      end: simEnd,
      group: group,
      location: %{ id: location["bId"], locType: locType, relType: relType, x: x, y: y }}
  end
end