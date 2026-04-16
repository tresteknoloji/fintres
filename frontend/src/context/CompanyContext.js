import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const CompanyContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function CompanyProvider({ children }) {
  const { token } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCompanies();
    }
  }, [token]);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API}/companies`);
      setCompanies(response.data);
      
      // Auto-select first company or restore from localStorage
      const savedCompanyId = localStorage.getItem("selectedCompanyId");
      if (savedCompanyId === "__all__") {
        setSelectedCompany(null);
      } else if (savedCompanyId) {
        const saved = response.data.find(c => c.id === savedCompanyId);
        if (saved) {
          setSelectedCompany(saved);
        } else if (response.data.length > 0) {
          setSelectedCompany(response.data[0]);
        }
      } else if (response.data.length > 0) {
        setSelectedCompany(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    if (company) {
      localStorage.setItem("selectedCompanyId", company.id);
    } else {
      localStorage.setItem("selectedCompanyId", "__all__");
    }
  };

  const addCompany = async (companyData) => {
    const response = await axios.post(`${API}/companies`, companyData);
    setCompanies(prev => [...prev, response.data]);
    if (!selectedCompany) {
      selectCompany(response.data);
    }
    return response.data;
  };

  const updateCompany = async (companyId, companyData) => {
    const response = await axios.put(`${API}/companies/${companyId}`, companyData);
    setCompanies(prev => prev.map(c => c.id === companyId ? response.data : c));
    if (selectedCompany?.id === companyId) {
      setSelectedCompany(response.data);
    }
    return response.data;
  };

  const deleteCompany = async (companyId) => {
    await axios.delete(`${API}/companies/${companyId}`);
    setCompanies(prev => prev.filter(c => c.id !== companyId));
    if (selectedCompany?.id === companyId) {
      const remaining = companies.filter(c => c.id !== companyId);
      selectCompany(remaining[0] || null);
    }
  };

  return (
    <CompanyContext.Provider value={{
      companies,
      selectedCompany,
      loading,
      selectCompany,
      addCompany,
      updateCompany,
      deleteCompany,
      refreshCompanies: fetchCompanies
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
}
