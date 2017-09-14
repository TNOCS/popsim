defmodule Crowd.Services.ActivitiesRegistry do
  use Agent

  @name { :global, __MODULE__ }

  def start_link(_opts) do
    IO.puts "Creating ETS table"
    :ets.new(:activities_registry, [:set, :public, :named_table]) # Must be public, since many tasks write to it concurrently
    Agent.start_link(fn -> %{} end, name: @name)
  end

  @doc """
    Insert a new activity in the registry.
  """
  def insert(id, activity) do
    :ets.insert(:activities_registry, { id, activity })
    :ok
  end

  @doc """
    Get first activities.
  """
  def get() do
    :ets.first(:activities_registry)
  end

  def get(key) do
    case :ets.lookup(:activities_registry, key) do
      [{^key, activity}] -> activity
      [] -> :error
    end
  end


  # use Agent
  @moduledoc """
    Activities registry. Used to store planned activities.

    iex> {:ok, _} = Crowd.Services.ActivitiesRegistry.start
    iex> Crowd.Services.ActivitiesRegistry.insert(1, "A")
    :ok
    iex> Crowd.Services.ActivitiesRegistry.insert(2, "B")
    :ok
    iex> Crowd.Services.ActivitiesRegistry.insert(3, "C")
    :ok
    iex> Crowd.Services.ActivitiesRegistry.get(3)
    [{3, "C"}]
    iex> Crowd.Services.ActivitiesRegistry.get(1)
    [{1, "A"}, {3, "C"}]
    iex> Crowd.Services.ActivitiesRegistry.update_mask(5, "A")
    :ok
    iex> Crowd.Services.ActivitiesRegistry.get
    [{5, "A"}, {2, "B"}, {3, "C"}]
    iex> Crowd.Services.ActivitiesRegistry.remove "B"
    :ok
    iex> Crowd.Services.ActivitiesRegistry.get
    [{5, "A"}, {3, "C"}]
    iex> 1..100 |> Enum.each(fn(i) -> Crowd.Services.ActivitiesRegistry.insert(ECS.Utils.random_string(), i) end)
    :ok
  """

  # @name { :global, __MODULE__ }

  # def start_link(_opts) do
  #   Agent.start_link(fn -> %{} end, name: @name)
  # end


  # @doc """
  #   Insert a new activity in the registry.
  # """
  # # @spec insert(%ECS.Entity{}, integer) :: :ok
  # def insert(id, activity) do
  #   Agent.update(@name, fn(registry) ->
  #     Map.put(registry, id, activity)
  #     # Map.merge( %{ id => activity }, registry )
  #   end)
  # end

  # @doc """
  #   Get all activities.
  # """
  # def get() do
  #   Agent.get(@name, fn (registry) -> registry end)
  # end

  # def get(key) do
  #   Agent.get(@name, fn (registry) -> Map.get(registry, key) end)
  # end

  # def remove(key) do
  #   Agent.update(@name, fn (registry) -> Map.delete(registry, key) end)
  # end

  # def keys() do
  #   Agent.get(@name, fn (registry) -> Map.keys(registry) end)
  # end

  # def values() do
  #   Agent.get(@name, fn (registry) -> Map.values(registry) end)
  # end
end