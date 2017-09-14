# Messenger

A simple Kafka messaging client.

## Installation

If [available in Hex](https://hex.pm/docs/publish), the package can be installed
by adding `messenger` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:messenger, "~> 0.1.0"}
  ]
end
```

Documentation can be generated with [ExDoc](https://github.com/elixir-lang/ex_doc)
and published on [HexDocs](https://hexdocs.pm). Once published, the docs can
be found at [https://hexdocs.pm/messenger](https://hexdocs.pm/messenger).

### Windows

Since the Kafka client uses brod, which relies on supervisor3 and snappyer, I needed to install a Linux shell on my Windows 10 PC to get it to compile (run `iex -S mix` and build your test environment too with `mix test`). After a successful build, you can run it again from the Windows commmand line.

1. Install msys2 from [here](http://www.msys2.org/)
2. Open a `bash` shell using the start menu (look for `msys2`) and run the following commands to install the tools ([see also here](https://erlang.mk/guide/installation.html#_on_windows)):
```bash
pacman -Syuu
pacman -Syuu # I had to do this twice, as updating pacman itself disturbed the update process
pacman -S git make mingw-w64-x86_64-gcc
```
3. Edit /c/msys64/USERNAME/.bash_profile and add the following `PATH` (so you have access to the Elixir and Erlang build tools):
```c
PATH=${PATH}:/c/progra~2/Elixir/bin:/c/progra~1/erl9.0/bin:/c/msys64/mingw64/bin/
```

