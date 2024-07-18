import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';


function Navigation() {
    return (
        <nav className="navbar">
            <ul>
                <li><Link to="/">אימון</Link></li>
                <li><Link to="/manage">דף ניהול</Link></li>
            </ul>
        </nav>
    );
}

export default Navigation;