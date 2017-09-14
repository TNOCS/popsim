defmodule ECS.Utils do
  @moduledoc """
    Utility function(s) for ECS
  """

  @doc "Generates a random base64 string of specified length"
  def random_string(length \\ 16) do
    :crypto.strong_rand_bytes(length)
      |> Base.url_encode64
      |> binary_part(0, length)
  end
end