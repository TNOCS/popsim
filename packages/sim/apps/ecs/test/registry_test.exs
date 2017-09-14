defmodule ECS.Registry.Test do
  use ExUnit.Case
  doctest ECS.Registry

  test "inserting an item into the registry" do
    { :ok, _ } = ECS.Registry.start
    ECS.Registry.insert A, 1
    assert ECS.Registry.get == [{A, 1}]
  end

  test "removing an item from the registry" do
    { :ok, _ } = ECS.Registry.start
    ECS.Registry.insert A, 1
    ECS.Registry.insert B, 2
    ECS.Registry.insert C, 3
    ECS.Registry.remove B
    assert ECS.Registry.get == [{A, 1}, {C, 3}]
  end

  test "updating an entity's mask in the registry" do
    { :ok, _ } = ECS.Registry.start
    ECS.Registry.insert A, 1
    ECS.Registry.insert B, 2
    ECS.Registry.insert C, 3
    ECS.Registry.update_mask B, 5
    assert ECS.Registry.get == [{A, 1}, {B, 5}, {C, 3}]
  end

  test "get entities from the registry based on a component mask" do
    { :ok, _ } = ECS.Registry.start
    ECS.Registry.insert A, 1
    ECS.Registry.insert B, 2
    ECS.Registry.insert C, 3
    assert ECS.Registry.get(2) == [{B, 2}, {C, 3}]
  end
end
