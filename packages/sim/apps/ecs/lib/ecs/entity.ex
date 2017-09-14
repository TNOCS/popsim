defmodule ECS.Entity do
  @moduledoc """
    A base for creating new Entities.
  """

  @type components_type :: list(ECS.Component)

  @type t :: %ECS.Entity{
    id: String.t,
    pid: pid
  }

  defstruct [:id, :pid]

  @doc "Create a new entity to keep the components"
  @spec new(components: components_type, mask: integer) :: t
  def new(components \\ [], mask \\ 0) do
    {:ok, pid} = Agent.start(fn () -> components end)
    entity = %ECS.Entity{
      id: ECS.Utils.random_string(),
      pid: pid
    }
    ECS.Registry.insert(entity, mask) # Register component for systems to reference.
    entity
  end

end