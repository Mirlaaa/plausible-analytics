defmodule PlausibleWeb.Plugins.API.Controllers.Goals do
  @moduledoc """
  Controller for the Goal resource under Plugins API
  """
  use PlausibleWeb, :plugins_api_controller

  operation(:index,
    summary: "Retrieve Goals",
    parameters: [
      limit: [in: :query, type: :integer, description: "Maximum entries per page", example: 10],
      after: [
        in: :query,
        type: :string,
        description: "Cursor value to seek after - generated internally"
      ],
      before: [
        in: :query,
        type: :string,
        description: "Cursor value to seek before - generated internally"
      ]
    ],
    responses: %{
      ok: {"Goals response", "application/json", Schemas.Goal.ListResponse},
      unauthorized: {"Unauthorized", "application/json", Schemas.Unauthorized}
    }
  )

  operation(:create,
    id: "Goal.GetOrCreate",
    summary: "Get or create Goal",
    request_body: {"Goal params", "application/json", Schemas.Goal.CreateRequest},
    responses: %{
      created:
        {"Goal", "application/json",
         %OpenApiSpex.Schema{
           oneOf: [Schemas.Goal.ListResponse, Schemas.Goal]
         }},
      unauthorized: {"Unauthorized", "application/json", Schemas.Unauthorized},
      payment_required: {"Payment required", "application/json", Schemas.PaymentRequired},
      unprocessable_entity:
        {"Unprocessable entity", "application/json", Schemas.UnprocessableEntity}
    }
  )

  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(
        %{private: %{open_api_spex: %{body_params: %{goal: _} = goal}}} = conn,
        _params
      ) do
    site = conn.assigns.authorized_site

    case API.Goals.create(site, goal) do
      {:ok, [goal]} ->
        conn
        |> put_view(Views.Goal)
        |> put_status(:created)
        |> put_resp_header("location", goals_url(base_uri(), :get, goal.id))
        |> render("goal.json", goal: goal, authorized_site: site)

      {:error, :upgrade_required} ->
        payment_required(conn)

      {:error, changeset} ->
        Errors.error(conn, 422, changeset)
    end
  end

  def create(
        %{private: %{open_api_spex: %{body_params: %{goals: goals}}}} = conn,
        _params
      ) do
    site = conn.assigns.authorized_site

    case API.Goals.create(site, goals) do
      {:ok, goals} ->
        location_headers = Enum.map(goals, &{"location", goals_url(base_uri(), :get, &1.id)})

        conn
        |> prepend_resp_headers(location_headers)
        |> put_view(Views.Goal)
        |> put_status(:created)
        |> render("index.json", goals: goals, authorized_site: site)

      {:error, :upgrade_required} ->
        payment_required(conn)

      {:error, changeset} ->
        Errors.error(conn, 422, changeset)
    end
  end

  @spec index(Plug.Conn.t(), %{}) :: Plug.Conn.t()
  def index(conn, _params) do
    {:ok, pagination} = API.Goals.get_goals(conn.assigns.authorized_site, conn.query_params)

    conn
    |> put_view(Views.Goal)
    |> render("index.json", %{pagination: pagination})
  end

  operation(:get,
    summary: "Retrieve Goal by ID",
    parameters: [
      id: [
        in: :path,
        type: :integer,
        description: "Goal ID",
        example: 123,
        required: true
      ]
    ],
    responses: %{
      ok: {"Goal", "application/json", Schemas.Goal},
      not_found: {"NotFound", "application/json", Schemas.NotFound},
      unauthorized: {"Unauthorized", "application/json", Schemas.Unauthorized},
      unprocessable_entity:
        {"Unprocessable entity", "application/json", Schemas.UnprocessableEntity}
    }
  )

  @spec get(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get(%{private: %{open_api_spex: %{params: %{id: id}}}} = conn, _params) do
    site = conn.assigns.authorized_site

    case API.Goals.get(site, id) do
      nil ->
        conn
        |> put_view(Views.Error)
        |> put_status(:not_found)
        |> render("404.json")

      goal ->
        conn
        |> put_view(Views.Goal)
        |> put_status(:ok)
        |> render("goal.json", goal: goal, authorized_site: site)
    end
  end

  operation(:delete,
    summary: "Delete Goal by ID",
    parameters: [
      id: [
        in: :path,
        type: :integer,
        description: "Goal ID",
        example: 123,
        required: true
      ]
    ],
    responses: %{
      no_content: {"NoContent", nil, nil},
      unauthorized: {"Unauthorized", "application/json", Schemas.Unauthorized}
    }
  )

  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(%{private: %{open_api_spex: %{params: %{id: id}}}} = conn, _params) do
    case Plausible.Goals.delete(id, conn.assigns.authorized_site) do
      :ok ->
        send_resp(conn, :no_content, "")

      {:error, :not_found} ->
        send_resp(conn, :no_content, "")
    end
  end

  defp payment_required(conn) do
    Errors.error(
      conn,
      402,
      "#{Plausible.Billing.Feature.RevenueGoals.display_name()} is part of the Plausible Business plan. To get access to this feature, please upgrade your account."
    )
  end
end
