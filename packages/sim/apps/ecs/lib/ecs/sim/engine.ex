defmodule ECS.Sim.Engine do
  use GenServer

  @moduledoc """
  The simulation engine is responsible for starting, pausing, stopping, and changing the speed of the simulation.

  It is also responsible for starting all required services, like the entity registry or the messenger.
  It keeps the main 'game' loop running, calling each System's update function in turn.
  """

  @name { :global, __MODULE__}

  ## Client API

  @doc """
  Starts the simulation engine.
  """
  def start_link(systems \\ []) do
    # opts = Map.get_and_update(opts, :name, @name)
    GenServer.start_link(__MODULE__, %ECS.Sim.State{ systems: systems }, name: @name)
  end

  def add_system(system) do
    GenServer.cast(@name, {:system, system})
  end

  @doc """
  Sets the simulation parameters:
  - startTime
  - endTime
  - dt: step size in seconds
  """
  def set(startTime: startTime, endTime: endTime, dt: dt) do
    GenServer.cast(@name, {:set, startTime, endTime, dt })
  end

  @doc """
  Starts the simulation.
  """
  def start() do
    GenServer.cast(@name, :initLoop)
    GenServer.cast(@name, :start)
  end

  @doc """
  Initializes the simulation.
  """
  def init() do
    GenServer.cast(@name, :initLoop)
  end

  @doc """
  Takes one step in the simulation.
  """
  def step() do
    GenServer.cast(@name, :step)
  end

  @doc """
  Pauzes the simulation.
  """
  def pause() do
    GenServer.cast(@name, :pause)
  end

  @doc """
  Stops the simulation.
  """
  def stop() do
    GenServer.cast(@name, :stop)
  end

  ## Server Callbacks

  def handle_cast({:system, system}, state) do
    newState = %{ state | systems: system ++ state.systems }
    {:noreply, newState}
  end

  def handle_cast({:set, startTime, endTime, dt}, state) do
    if state.running do
      {:noreply, state}
    else
      newState = %{ state | curTime: startTime, startTime: startTime, endTime: endTime, dt: dt }
      IO.puts ""
      IO.puts "SIMULATION SETTINGS:"
      IO.puts ""
      IO.puts "   From #{startTime} till #{endTime}, steps #{dt}s."
      IO.puts ""
      IO.puts "Enter 'ECS.Sim.Engine.init' and 'ECS.Sim.Engine.step' to run the simulation stepwise."
      IO.puts "Enter 'ECS.Sim.Engine.start' to run the simulation."
      IO.puts ""
      IO.inspect newState
      {:noreply, newState}
    end
  end

  def handle_cast(:start, state) do
    IO.puts "START:"
    IO.inspect state
    if state.running do
      {:noreply, state}
    else
      newState = %{ state | running: true }
      run()
      {:noreply, newState}
    end
  end

  def handle_cast(:step, state) do
    IO.puts ""
    IO.puts "STEP, current time #{state.curTime}:"
    IO.puts ""
    IO.inspect state
    if !state.running do
      run()
    end
    {:noreply, state}
  end

  def handle_cast(:initLoop, state) do
    IO.puts "INITIALIZING:"
    state.systems
    |> Enum.each(&{ &1.init(state.startTime, state.dt)})
    {:noreply, state}
  end

  def handle_cast(:stop, state) do
    IO.puts "STOP:"
    if state.running do
      newState = %{ state | running: false }
      {:noreply, newState}
    end
  end

  defp run() do
    Process.send(self(), :run, [])
  end

  def handle_info(:run, state) do
    IO.puts "RUN:"
    IO.inspect state
    # time = DateTime.utc_now()

    # Do the desired work here
    # Enum.each(state.systems, fn system ->
    #   IO.inspect system
    #   system.update(time, state.dt)
    # end)
    state.systems
    |> Enum.each(&{ &1.update(state.curTime, state.dt)})

    updatedTime = DateTime.to_unix(state.curTime, :millisecond) + 1000 * state.dt
    |> DateTime.from_unix!(:millisecond)
    state = %{state | curTime: updatedTime }
    # time = DateTime.utc_now()
    # IO.puts "It is now #{time}"
    if state.running do
      run()
    end
    {:noreply, state}
  end

end