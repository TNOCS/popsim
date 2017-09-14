defmodule ECS.Registry do
  @moduledoc """
    Entity registry. Used by systems to locate entities and its component mask.

    iex> {:ok, _} = ECS.Registry.start
    iex> ECS.Registry.insert("A", 1)
    :ok
    iex> ECS.Registry.insert("B", 2)
    :ok
    iex> ECS.Registry.insert("C", 3)
    :ok
    iex> ECS.Registry.get(3)
    [{"C", 3}]
    iex> ECS.Registry.get(1)
    [{"A", 1}, {"C", 3}]
    iex> ECS.Registry.update_mask("A", 5)
    :ok
    iex> ECS.Registry.get
    [{"A", 5}, {"B", 2}, {"C", 3}]
    iex> ECS.Registry.remove "B"
    :ok
    iex> ECS.Registry.get
    [{"A", 5}, {"C", 3}]
    iex> 1..100 |> Enum.each(fn(i) -> ECS.Registry.insert(ECS.Utils.random_string(), i) end)
    :ok
  """
  use Bitwise

  @name { :global, __MODULE__ }
  # @name __MODULE__

  def start_link do
    Agent.start_link(fn -> [] end, name: @name)
  end

  @doc """
    Insert a new entity in the registry.
  """
  @spec insert(%ECS.Entity{}, integer) :: :ok
  def insert(entity, component_mask) do
    Agent.update(@name, fn(registry) ->
      [{ entity, component_mask } | registry]
      # registry ++ [{ entity, component_mask } ]
    end)
  end

  @doc """
    Remove an existing entity from the registry.
  """
  @spec remove(%ECS.Entity{}) :: [%ECS.Entity{}]
  def remove(entity) do
    Agent.update(@name, fn(registry) ->
      List.keydelete(registry, entity, 0)
    end)
  end

  @doc """
    Update the entity's component mask'.
  """
  @spec update_mask(%ECS.Entity{}, integer) :: any
  def update_mask(entity, component_mask) do
    Agent.update(@name, fn(registry) ->
      List.keyreplace(registry, entity, 0, { entity, component_mask} )
    end)
  end

  @doc """
    Get all entities.
  """
  @spec get() :: [%ECS.Entity{}]
  def get() do
    Agent.get(@name, fn (registry) -> registry end)
  end

  @doc """
    Get all entities using a component mask that have the required components.
  """
  @spec get(integer) :: [%ECS.Entity{}]
  def get(mask) do
    Agent.get(@name, fn(registry) ->
      registry
      |> Enum.filter(fn ( {_entity, component_mask} ) -> mask == (component_mask &&& mask) end)
      # Enum.filter(entities, fn ( %ECS.Entity{ mask: component_mask } ) ->
      #   mask == (component_mask &&& mask)
      # end)
    end)
  end
end