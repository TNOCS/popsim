defmodule Crowd.Systems.MovementSystem do
  @behaviour ECS.System

  alias Crowd.Components.MoveableComponent
  alias Crowd.Components.PositionComponent
  alias Crowd.Components.AgendaComponent
  alias Crowd.Services.ActivitiesRegistry

  @mask Crowd.Utils.create_mask( MoveableComponent.new |> Map.merge(PositionComponent.new) |> Map.merge(AgendaComponent.new))
  @position PositionComponent.name
  @moveable MoveableComponent.name
  @agenda AgendaComponent.name

  def init(_time, _dt) do
  end

  def update(time, dt) do
    IO.puts "Updating movements, mask: #{@mask}"
    ECS.Registry.get(@mask)
    |> Enum.each(fn { entity, _mask } -> awake?(time, dt, entity) end)
  end

  @spec awake?(DateTime, float, %ECS.Entity{}) :: nil
  defp awake?(time, dt, entity) do
    # IO.inspect entity
    # IO.puts "Processing entity"
    Agent.update(entity.pid, fn state ->
      case DateTime.compare(time, state[@agenda].awake) do
        :gt -> update_position(dt, state)
        _ -> state
      end
    end)
  end

  defp update_position(dt, state) do
    [nextActivityId | _] = state[@agenda].activities
    curActivity = ActivitiesRegistry.get nextActivityId
    x1 = state[@position].x
    y1 = state[@position].y
    x2 = curActivity.location.x
    y2 = curActivity.location.y
    dx = x2 - x1
    dy = y2 - y1
    ds = :math.sqrt(dx * dx + dy * dy)
    v = curActivity.speed
    s = v * dt
    # IO.puts "Moved #{s}m, to go #{ds - s}m"
    new_pos = if s >= ds do
      # Reached goal of current activity - remove it
      [_h | t] = state[@agenda].activities;
      [next_activity_id | _] = t
      next_activity = ActivitiesRegistry.get next_activity_id
      IO.puts "Next activity: #{DateTime.to_string next_activity.start}"
      state
      |> put_in([ @agenda, :awake], next_activity.start)
      |> put_in([ @agenda, :activities ], t)
      %{ x: x2, y: y2 }
    else
      alpha = :math.atan(dy / dx)
      %{ x: x1 + s * :math.cos(alpha), y: y1 + s * :math.sin(alpha) }
      # p = s / ds
      # %{ x: x1 + p * dx, y: y1 + p * dy }
    end
    # IO.puts "Moved #{s}m from (#{x1}, #{y1}) -> (#{new_pos.x}, #{new_pos.y}), goal (#{x2}, #{y2}) with speed #{v}m/s."
    # case [h | _] = state[@agenda].activities do
    # if (["2a93b83e-2673-4899-bf12-ed920dbef001" | _] = state[@agenda].activities) do
    #   IO.puts "Moved #{s}m from (#{x1}, #{y1}) -> (#{new_pos.x}, #{new_pos.y}) with speed #{v}m/s."
    # end
    state
    |> put_in([ @moveable, :speed ], v)
    |> put_in([ @position, :x ], new_pos.x)
    |> put_in([ @position, :y ], new_pos.y)
  end
end