import { useSearchParams } from "react-router-dom";
import { Icon } from "./UI";
export default function Search({ placeholder }) {
  const [params, setParams] = useSearchParams();
  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        const values = new FormData(e.currentTarget);
        const next = {};
        if (values.get("search").trim())
          next.search = values.get("search").trim();
        if (values.get("domain")) next.domain = values.get("domain");
        setParams(next);
      }}
    >
      <label className="search-input">
        <Icon name="search" />
        <input
          key={params.get("search") || ""}
          name="search"
          aria-label="Search"
          placeholder={placeholder}
          defaultValue={params.get("search") || ""}
        />
      </label>
      <select
        name="domain"
        aria-label="Domain"
        defaultValue={params.get("domain") || ""}
      >
        <option value="">All finance</option>
        <option value="FINANCE">Finance</option>
      </select>
      <button className="button small">Search</button>
      {params.size > 0 && (
        <button
          type="button"
          className="text-button"
          onClick={() => setParams({})}
        >
          Clear
        </button>
      )}
    </form>
  );
}
