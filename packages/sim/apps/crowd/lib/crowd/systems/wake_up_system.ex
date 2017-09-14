defmodule Crowd.Systems.WakeUpSystem do
  @moduledoc """
  Run initially to wake up all entities, i.e. set the Agenda.awake time.
  """
  @behaviour ECS.System

  alias Crowd.Components.AgendaComponent
  alias Crowd.Services.ActivitiesRegistry

  @mask Crowd.Utils.create_mask(AgendaComponent.new)


  def init(_time, _dt) do
    IO.puts "Initializing AgendaComponent's awake time, mask: #{@mask}"
    IO.inspect DateTime.utc_now
    ECS.Registry.get(@mask)
    |> Enum.each(fn { entity, _mask } -> update_awake_time(entity) end)
    IO.inspect DateTime.utc_now
  end

  def update(_time, _dt) do
  end

  defp update_awake_time(entity) do
    # IO.puts "WakeUp: Processing entity"
    Agent.update(entity.pid, fn state ->
      agenda = state.agenda
      # IO.inspect agenda
      [next_activity_id | _] = agenda.activities
      next_activity = ActivitiesRegistry.get next_activity_id
      # IO.puts "Next activity: #{DateTime.to_string next_activity.start}"
      newAgenda = put_in(agenda, [:awake], next_activity.start)
      # IO.inspect newAgenda
      %{state | agenda: newAgenda }
      # IO.inspect newState
    end)
  end

end