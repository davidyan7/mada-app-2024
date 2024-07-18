import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, set, push, remove } from 'firebase/database';
import citiesJsonData from '../assets/pakarRegions.json';
import { processCitiesData } from '../utils/processCitiesData';
import Select from 'react-select';

function ManagePage() {
    const [cities, setCities] = useState([]);
    const [selectedCities, setSelectedCities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegions, setSelectedRegions] = useState([]);

    useEffect(() => {
        const processedCities = processCitiesData(citiesJsonData);
        setCities(processedCities);
    }, []);

    const handleCitySelect = (city) => {
        if (!selectedCities.includes(city)) {
            setSelectedCities([...selectedCities, city]);
        }
    };

    const handleCityDelete = (city) => {
        setSelectedCities(selectedCities.filter((c) => c !== city));
    };

    const handlePlayAlarm = () => {
        const citiesToTrigger = selectedCities.filter(cityName => {
            const cityData = cities.find(city => city.HEB_NAME === cityName);
            return selectedRegions.length === 0 || selectedRegions.includes(cityData.MadaRegions);
        });

        if (citiesToTrigger.length === 0) {
            return;
        }

        citiesToTrigger.forEach((cityName) => {
            const cityData = cities.find(city => city.HEB_NAME === cityName);
            if (cityData) {
                const alarmRef = push(ref(db, 'alarms'));
                set(alarmRef, {
                    city: cityName,
                    timestamp: Date.now(),
                    countdown: cityData.MIGUN_TIME,
                    isActive: true
                });
            }
        });

        setSelectedCities(selectedCities.filter(city => !citiesToTrigger.includes(city)));
    };

    const handleRemoveAllAlarms = () => {
        const isConfirmed = window.confirm('Are you sure you want to remove all alarms? This action cannot be undone.');

        if (isConfirmed) {
            const alarmsRef = ref(db, 'alarms');
            remove(alarmsRef)
                .then(() => {
                    alert('All alarms have been removed from the database.');
                })
                .catch((error) => {
                    console.error("Error removing alarms: ", error);
                    alert('An error occurred while removing alarms.');
                });
        } else {
            console.log('Alarm removal cancelled by user.');
        }
    };

    const uniqueRegions = [...new Set(cities.map(city => city.MadaRegions))];
    const regionOptions = uniqueRegions.map(region => ({ value: region, label: region }));

    const handleRegionChange = (selectedOptions) => {
        setSelectedRegions(selectedOptions.map(option => option.value));
    };

    const filteredCities = cities.filter((city) =>
        city.HEB_NAME.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedRegions.length === 0 || selectedRegions.includes(city.MadaRegions))
    );

    const filteredSelectedCities = selectedCities.filter(cityName => {
        const cityData = cities.find(city => city.HEB_NAME === cityName);
        return selectedRegions.length === 0 || selectedRegions.includes(cityData.MadaRegions);
    });

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    return (
        <div className="page-container">
            <div className="column">
                <h2>רשימת ערים להפעלה</h2>
                <div className="scrollable-list">
                    <ul>
                        {filteredSelectedCities.map((city) => (
                            <li key={city} className="selected-city-item">
                                {city}
                                <button onClick={() => handleCityDelete(city)} className="delete-button">Delete</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <button
                    onClick={handlePlayAlarm}
                    className="play-alarm-button"
                    disabled={filteredSelectedCities.length === 0}
                >
                    Play Alarm
                </button>
                <button onClick={handleRemoveAllAlarms} className="remove-all-alarms-button">Remove All Alarms</button>
            </div>
            <div className="column">
                <h2>רשימת ערים</h2>
                <Select
                    isMulti
                    name="regions"
                    options={regionOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={handleRegionChange}
                    placeholder="Filter by MadaRegions..."
                />
                <div className="search-input-container">
                    <input
                        type="text"
                        placeholder="חיפוש"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button onClick={handleClearSearch} className="clear-search-button">Clear</button>
                </div>
                <div className="scrollable-list">
                    <ul>
                        {filteredCities.map((city) => (
                            <li key={city.HEB_NAME} onClick={() => handleCitySelect(city.HEB_NAME)} className="city-item">
                                {city.HEB_NAME}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ManagePage;
