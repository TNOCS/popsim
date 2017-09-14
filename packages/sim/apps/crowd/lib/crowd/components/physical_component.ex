defmodule Crowd.Components.PhysicalComponent do
  @moduledoc """
  Component that contains the variables to give a component a size.
  """

  @behaviour ECS.Component

  @component_type :physical

  @doc """
  Create a new physical component.
  When type is:
  circular -> input circle radius in meter
  rectangular -> input width and height in meter
  boundary -> input is a list of xy tuples, where each tuple is the x and y position in meters
              with respect to the placeable position (typically, the origin for static objects).
  """
  def new( %{type: _type, r: _r } = data) do
    %{ @component_type => data }
    #   case type do
    #   "circular" -> %{ @component_type => %{ type: type, r: a } }
    #   "rectangular" -> %{ @component_type =>  %{ type: type, w: a, h: b } }
    #   "boundary" -> %{ @component_type => %{ type: type, xy: a } }
    #   _ -> IO.puts "#{__MODULE__}: Error - unknown type: #{type}"
    # end
  end

  def name, do: @component_type
end