defmodule Crowd.Components.AgendaComponent do
  @moduledoc """
  Component that contains the variables for an entity's agenda.
  """

  @behaviour ECS.Component

  @component_type :agenda

  @doc """
  Create a new Agenda component.
  """
  def new( %{ activities: a, roles: r, locations: l } \\ %{ activities: [], roles: [], locations: []}) do
    %{ @component_type => %{ activities: a, roles: r, locations: l, awake: nil } }
  end

  def name, do: @component_type

end