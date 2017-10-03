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
    updated = if s >= ds do
      # IO.puts "POSITION REACHED, current state:"
      # IO.inspect state
      # Reached goal of current activity - remove it
      [_h | t] = state[@agenda].activities;
      [next_activity_id | _] = t
      next_activity = ActivitiesRegistry.get next_activity_id
      # IO.puts "Next activity: #{DateTime.to_string next_activity.start}"
      new_state = state
      |> put_in([ @agenda, :awake], next_activity.start)
      |> put_in([ @agenda, :activities ], t)
      # IO.puts "Final state:"
      # IO.inspect new_state
      %{ x: x2, y: y2, state: new_state, inside?: true }
    else
      case dx do
        0 -> %{ x: x1, y: y1 + s, state: state, inside?: false }
        _ -> alpha = :math.atan(dy / dx)
             %{ x: x1 + s * :math.cos(alpha), y: y1 + s * :math.sin(alpha), state: state, inside?: false }
      end
      # p = s / ds
      # %{ x: x1 + p * dx, y: y1 + p * dy }
    end
    # IO.puts "Moved #{s}m from (#{x1}, #{y1}) -> (#{updated.x}, #{updated.y}), goal (#{x2}, #{y2}) with speed #{v}m/s."
    # case [h | _] = state[@agenda].activities do
    # if (["2a93b83e-2673-4899-bf12-ed920dbef001" | _] = state[@agenda].activities) do
    #   IO.puts "Moved #{s}m from (#{x1}, #{y1}) -> (#{updated.x}, #{updated.y}) with speed #{v}m/s."
    # end
    updated.state
    |> put_in([ @moveable, :speed ], v)
    |> put_in([ @position, :x ], updated.x)
    |> put_in([ @position, :y ], updated.y)
    |> put_in([ @position, :inside? ], updated.inside?)
  end
end