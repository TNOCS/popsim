defmodule Crowd.Mixfile do
  use Mix.Project

  def project do
    [
      app: :crowd,
      version: "0.1.0",
      build_path: "../../_build",
      config_path: "../../config/config.exs",
      deps_path: "../../deps",
      lockfile: "../../mix.lock",
      elixir: "~> 1.5",
      start_permanent: Mix.env == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger],
      # Specifies the default application in an umbrella project
      # See also: https://elixir-lang.org/getting-started/mix-otp/dependencies-and-umbrella-apps.html#internal-dependencies
      mod: {Crowd.Sim, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      # Add an internal dependency to one of the other umbrella projects.
      # See also: https://elixir-lang.org/getting-started/mix-otp/dependencies-and-umbrella-apps.html#internal-dependencies
      {:ecs, in_umbrella: true}
      # {:dep_from_hexpm, "~> 0.3.0"},
      # {:dep_from_git, git: "https://github.com/elixir-lang/my_dep.git", tag: "0.1.0"},
      # {:sibling_app_in_umbrella, in_umbrella: true},
    ]
  end
end