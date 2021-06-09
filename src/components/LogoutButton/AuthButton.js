import React from "react";
import {useAuth0} from "@auth0/auth0-react";

export const LogoutButton = (onLogout) => {
    const {logout} = useAuth0();

    return (
        <button className="floatingButton theme-white" onClick={() => {
            logout({returnTo: window.location.origin});
        }}>
            Log Out
        </button>
    );
}