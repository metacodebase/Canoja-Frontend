/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { getActiveBusinessId, getToken, setActiveBusinessId as persistActiveBusinessId } from "../services/api";
import { clearSession, persistSession, persistUser, readStoredUser, selectInitialBusiness } from "../services/authStorage";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [activeBusinessId, setActiveBusinessId] = useState(getActiveBusinessId());
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = getToken();
		if (token) {
			try {
				setUser(readStoredUser() || jwtDecode(token));
			} catch {
				clearSession();
				setUser(null);
			}
		}
		setLoading(false);
	}, []);

	const login = (token, userData, refreshToken) => {
		persistSession(token, userData, refreshToken);
		setUser(userData);
		setActiveBusinessId(selectInitialBusiness(userData?.businesses));
	};

	const updateUser = (userData) => {
		persistUser(userData);
		setUser(userData);
	};

	const selectBusiness = (businessId) => {
		persistActiveBusinessId(businessId);
		setActiveBusinessId(businessId);
	};

	const logout = () => {
		clearSession();
		setActiveBusinessId(null);
		setUser(null);
	};

	if (loading) {
		return null; // or a loading spinner
	}

	return (
		<AuthContext.Provider value={{
			user,
			login,
			logout,
			updateUser,
			activeBusinessId,
			selectBusiness,
			businesses: user?.businesses || [],
			isAuthenticated: !!user,
		}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
