import { useState } from "react";
import Select from "react-select";
import { useAuth } from "../hooks/useAuth";
import qs from "qs";
import { Search, Loader2 } from "lucide-react";
import domainesActivites from "../data/domaines";

const domainOptions = domainesActivites.map((d) => ({ label: d, value: d }));

const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "40px",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "rgb(55 65 81)",
    borderColor: state.isFocused ? "#3B82F6" : "#4B5563",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3B82F6"
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "rgb(31 41 55)",
    color: "white",
    zIndex: 50
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3B82F6"
      : state.isFocused
      ? "rgba(59, 130, 246, 0.3)"
      : "rgb(31 41 55)",
    color: "white",
    cursor: "pointer"
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#1E3A8A",
    borderRadius: "6px"
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "white",
    fontSize: "13px"
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9CA3AF",
    fontSize: "13px"
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "white"
  })
};

export default function ScrapingForm({ onResults }) {
  const { api } = useAuth();
  const [form, setForm] = useState({
    domaines: [],
    reference: "",
    acheteur: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSelectChange = (selectedOptions) => {
    setForm({ ...form, domaines: selectedOptions.map((opt) => opt.value) });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = {
        domaine: form.domaines,
        reference: form.reference,
        acheteur: form.acheteur
      };

      const { data } = await api.get("/marches", {
        params,
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: "repeat" })
      });

      onResults(data);
    } catch (err) {
      console.error("Erreur scraping:", err.response?.data || err.message);
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md"
    >
      {/* Domaines */}
      <div className="min-w-[200px] flex-1">
        <Select
          isMulti
          name="domaines"
          options={domainOptions}
          styles={selectStyles}
          onChange={handleSelectChange}
          placeholder="Domaines"
          noOptionsMessage={() => "Aucun domaine"}
          isDisabled={loading}
          theme={(theme) => ({
            ...theme,
            borderRadius: 8,
            colors: {
              ...theme.colors,
              primary25: '#1E3A8A',
              primary: '#3B82F6',
              neutral0: 'rgb(55 65 81)',
              neutral5: 'rgb(75 85 99)',
              neutral10: 'white',
              neutral20: '#9CA3AF',
              neutral30: '#6B7280',
              neutral80: 'white'
            },
          })}
        />
      </div>

      {/* Référence */}
      <input
        name="reference"
        value={form.reference}
        onChange={handleChange}
        placeholder="Référence"
        disabled={loading} 
        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 w-[160px] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Acheteur */}
      <input
        name="acheteur"
        value={form.acheteur}
        onChange={handleChange}
        placeholder="Acheteur"
        disabled={loading} 
        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 w-[200px] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Bouton */}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
        {loading ? "Recherche..." : "Rechercher"}
      </button>
    </form>
  );
}