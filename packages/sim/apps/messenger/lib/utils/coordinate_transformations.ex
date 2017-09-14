defmodule Utils.CoordinateTransformations do
  @moduledoc """
    Convert from RD (Rijksdriehoek) to WGS84 coordinates

    See also [here](http://home.solcon.nl/pvanmanen/Download/Transformatieformules.pdf) or
    [here](https://media.thomasv.nl/2015/07/Transformatieformules.pdf)

    Examples

    iex> Utils.CoordinateTransformations.wgs84_to_rd 5, 52
    %{x: 128409.89997767913, y: 445806.27561779344}
    iex> Utils.CoordinateTransformations.wgs84_to_rd 5.53612, 52.31903
    %{x: 165153.3083072555, y: 481241.3530683397}
    iex> Utils.CoordinateTransformations.wgs84_to_rd lon: 5.53612, lat: 52.31903
    %{x: 165153.3083072555, y: 481241.3530683397}
    iex> Utils.CoordinateTransformations.rd_to_wgs84 128409.89997767913, 445806.27561779344
    %{lat: 51.99999999928592, lon: 5.000000002150596}
    iex> Utils.CoordinateTransformations.rd_to_wgs84 x: 128409.89997767913, y: 445806.27561779344
    %{lat: 51.99999999928592, lon: 5.000000002150596}
  """

  @x0 155000
  @y0 463000
  @lat0 52.15517440
  @lon0 5.38720621

  @typedoc """
    An XY structure.
  """
  @type xy :: %{
    x: float,
    y: float
  }

  @typedoc """
    An XY structure.
  """
  @type ll :: %{
    lat: float,
    lon: float
  }

  @doc """
    Convert a WGS84 coordinate to Rijksdriehoek (RD, projection 28992)
  """
  @spec wgs84_to_rd(ll) :: xy
  def wgs84_to_rd([lon: lon, lat: lat] ) do
    wgs84_to_rd(lon, lat)
  end

  @doc """
    Convert a WGS84 coordinate to Rijksdriehoek (RD, projection 28992)
  """
  @spec wgs84_to_rd(float, float) :: xy
  def wgs84_to_rd(lon, lat) do
    dlat = 0.36 * (lat - @lat0)
    dlat2 = dlat * dlat
    dlat3 = dlat * dlat2
    dlon = 0.36 * (lon - @lon0)
    dlon2 = dlon * dlon
    dlon3 = dlon * dlon2
    dlon4 = dlon * dlon3
    x = @x0 + 190094.945 * dlon - 11832.228 * dlat * dlon - 114.221 * dlat2 * dlon - 32.391 * dlon3 - 0.705 * dlat - 2.340 * dlat3 * dlon - 0.608 * dlat * dlon3 - 0.008 * dlon2 + 0.148 * dlat2 * dlon3
    y = @y0 + 309056.544 * dlat + 3638.893 * dlon2 + 73.077 * dlat2 - 157.984 * dlat * dlon2 + 59.788 * dlat3 + 0.433 * dlon - 6.439 * dlat2 * dlon2 - 0.032 * dlat * dlon + 0.092 * dlon4 - 0.054 * dlat * dlon4
    %{ x: x, y: y }
  end

  @doc """
    Convert an RD (Rijksdriehoek) coordinate to WGS84 latitude and longitude.
  """
  @spec rd_to_wgs84(xy) :: ll
  def rd_to_wgs84([ x: x, y: y ]) do
    rd_to_wgs84(x, y)
  end

  @doc """
    Convert an RD (Rijksdriehoek) coordinate to WGS84 latitude and longitude.
  """
  @spec rd_to_wgs84(float, float) :: ll
  def rd_to_wgs84(x, y) do
    dx = (x - @x0) * 0.00001
    dy = (y - @y0) * 0.00001
    dx2 = dx * dx
    dx3 = dx * dx2
    dx4 = dx * dx3
    dx5 = dx * dx4
    dy2 = dy * dy
    dy3 = dy * dy2
    dy4 = dy * dy3
    lat = @lat0 + ( 3235.65389 * dy - 32.58297 * dx2 - 0.24750 * dy2 - 0.84978 * dx2 * dy - 0.06550 * dy3 - 0.01709 * dx2 * dy2 - 0.00738 * dx + 0.00530 * dx4 - 0.00039 * dx2 * dy3 + 0.00033 * dx4 * dy - 0.00012 * dx * dy ) / 3600
    lon = @lon0 + ( 5260.52916 * dx + 105.94685 * dx * dy + 2.45656 * dx * dy2 - 0.81885 * dx3 + 0.05594 * dx * dy3 - 0.05607 * dx3 * dy + 0.01199 * dy - 0.00256 * dx3 * dy2 + 0.00128 * dx * dy4 + 0.00022 * (dy2 - dx2) + 0.00026 * dx5 ) / 3600
    %{ lat: lat, lon: lon }
  end

end