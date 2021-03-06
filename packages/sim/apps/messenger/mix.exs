defmodule Messenger.Mixfile do
  use Mix.Project

  def project do
    [
      app: :messenger,
      version: "0.1.0",
      elixir: "~> 1.5",
      start_permanent: Mix.env == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [
        :logger,
        :logger_file_backend,
        :kaffe
      ]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      { :kaffe, "~> 1.3" },
      { :poison, "~> 3.1" },
      { :logger_file_backend, "~> 0.0.10"}
      # {:dep_from_hexpm, "~> 0.3.0"},
      # {:dep_from_git, git: "https://github.com/elixir-lang/my_dep.git", tag: "0.1.0"},
    ]
  end
end
